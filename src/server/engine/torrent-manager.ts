import WebTorrent from 'webtorrent';
import { torrentEvents } from './events.js';
import { db } from '../db/client.js';
import { torrents } from '../db/schema.js';
import { config } from '../config.js';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { autoIdentify } from '../services/media-identifier.js';

let client: WebTorrent.Instance;

const progressIntervals = new Map<string, NodeJS.Timeout>();
const torrentMap = new Map<string, WebTorrent.Torrent>();

export function getClient() {
  return client;
}

/** Synchronous lookup — uses the torrentMap for O(1) access. */
function findTorrent(infoHash: string): WebTorrent.Torrent | undefined {
  return torrentMap.get(infoHash);
}

function parseInfoHash(magnet: string): string | null {
  const match = magnet.match(/btih:([a-fA-F0-9]{40})/);
  if (match) return match[1].toLowerCase();
  const b32 = magnet.match(/btih:([A-Z2-7]{32})/i);
  if (b32) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    for (const c of b32[1].toUpperCase()) {
      bits += alphabet.indexOf(c).toString(2).padStart(5, '0');
    }
    let hex = '';
    for (let i = 0; i < bits.length; i += 4) {
      hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
    }
    return hex.slice(0, 40);
  }
  return null;
}

function parseDN(magnet: string): string {
  const match = magnet.match(/[?&]dn=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : 'Unknown';
}

export function initEngine() {
  if (!fs.existsSync(config.downloadsDir)) {
    fs.mkdirSync(config.downloadsDir, { recursive: true });
  }

  client = new WebTorrent({ torrentPort: config.torrentPort } as any);

  client.on('error', (err) => {
    console.error('[WebTorrent] Engine error:', typeof err === 'string' ? err : err.message);
  });

  // Restore persisted torrents — resume downloading and seeding, skip paused/error
  const saved = db.select().from(torrents).all();
  for (const t of saved) {
    if (t.status === 'paused' || t.status === 'error') continue;
    const src = t.magnet || (t.torrentFile ? Buffer.from(t.torrentFile, 'base64') : null);
    if (!src) continue;
    try {
      addToEngine(src, t.savePath);
    } catch (e) {
      console.warn(`[Restore] Failed to restore ${t.infoHash}:`, e);
    }
  }

  // Graceful shutdown — flush progress to DB before exit
  const shutdown = () => {
    console.log('[Engine] Shutting down, flushing torrent progress...');
    for (const [infoHash, torrent] of torrentMap) {
      try {
        db.update(torrents).set({
          downloaded: torrent.downloaded,
          uploaded: torrent.uploaded,
          status: torrent.done ? 'seeding' : 'downloading',
        }).where(eq(torrents.infoHash, infoHash)).run();
      } catch {}
    }
    client.destroy();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

export function addTorrent(source: string | Buffer, savePath?: string): { infoHash: string; name: string } {
  const dest = savePath || config.downloadsDir;

  if (typeof source === 'string') {
    const infoHash = parseInfoHash(source);
    if (!infoHash) throw new Error('Invalid magnet link: no info hash found');

    const name = parseDN(source);

    const existing = findTorrent(infoHash);
    if (existing) {
      return { infoHash, name: existing.name || name };
    }

    // Persist to DB immediately
    db.insert(torrents).values({
      infoHash,
      name,
      magnet: source,
      savePath: dest,
      status: 'downloading',
      totalSize: 0,
    }).onConflictDoUpdate({
      target: torrents.infoHash,
      set: { status: 'downloading' },
    }).run();

    torrentEvents.emit('torrent:added', { infoHash, name });
    addToEngine(source, dest);

    return { infoHash, name };
  } else {
    const torrentFile64 = source.toString('base64');
    addToEngineWithPersist(source, dest, torrentFile64);
    return { infoHash: 'pending', name: 'Loading...' };
  }
}

function addToEngine(source: string | Buffer, savePath: string) {
  if (typeof source === 'string') {
    const hash = parseInfoHash(source);
    if (hash && findTorrent(hash)) return;
  }

  client.add(source as any, { path: savePath }, (torrent) => {
    setupTorrentHandlers(torrent);

    db.update(torrents).set({
      name: torrent.name,
      totalSize: torrent.length,
      status: torrent.done ? 'seeding' : 'downloading',
    }).where(eq(torrents.infoHash, torrent.infoHash)).run();

    torrentEvents.emit('torrent:metadata', {
      infoHash: torrent.infoHash,
      name: torrent.name,
      totalSize: torrent.length,
      files: torrent.files.map(f => ({ name: f.name, length: f.length })),
    });

    // Auto-identify once we have the real torrent name
    autoIdentify(torrent.infoHash, torrent.name).catch(err => console.warn('[AutoIdentify] Failed:', err.message || err));
  });
}

function addToEngineWithPersist(source: Buffer, savePath: string, torrentFile64: string) {
  client.add(source as any, { path: savePath }, (torrent) => {
    db.insert(torrents).values({
      infoHash: torrent.infoHash,
      name: torrent.name,
      torrentFile: torrentFile64,
      savePath,
      status: torrent.done ? 'seeding' : 'downloading',
      totalSize: torrent.length,
    }).onConflictDoUpdate({
      target: torrents.infoHash,
      set: { name: torrent.name, status: 'downloading', totalSize: torrent.length },
    }).run();

    setupTorrentHandlers(torrent);
    torrentEvents.emit('torrent:added', { infoHash: torrent.infoHash, name: torrent.name });
    autoIdentify(torrent.infoHash, torrent.name).catch(err => console.warn('[AutoIdentify] Failed:', err.message || err));
  });
}

function setupTorrentHandlers(torrent: WebTorrent.Torrent) {
  torrentMap.set(torrent.infoHash, torrent);

  torrent.on('metadata', () => {
    db.update(torrents).set({
      name: torrent.name,
      totalSize: torrent.length,
    }).where(eq(torrents.infoHash, torrent.infoHash)).run();

    torrentEvents.emit('torrent:metadata', {
      infoHash: torrent.infoHash,
      name: torrent.name,
      totalSize: torrent.length,
      files: torrent.files.map(f => ({ name: f.name, length: f.length })),
    });
  });

  torrent.on('done', () => {
    db.update(torrents).set({
      status: 'seeding',
      downloaded: torrent.downloaded,
      completedAt: new Date(),
    }).where(eq(torrents.infoHash, torrent.infoHash)).run();

    torrentEvents.emit('torrent:done', { infoHash: torrent.infoHash });
  });

  torrent.on('error', (err) => {
    db.update(torrents).set({ status: 'error' })
      .where(eq(torrents.infoHash, torrent.infoHash)).run();
    torrentEvents.emit('torrent:error', {
      infoHash: torrent.infoHash,
      message: typeof err === 'string' ? err : err.message,
    });
  });

  let tickCount = 0;
  const interval = setInterval(() => {
    if ((torrent as any).destroyed) {
      clearInterval(interval);
      progressIntervals.delete(torrent.infoHash);
      torrentMap.delete(torrent.infoHash);
      return;
    }
    torrentEvents.emit('torrent:progress', {
      infoHash: torrent.infoHash,
      downloaded: torrent.downloaded,
      uploaded: torrent.uploaded,
      downloadSpeed: torrent.downloadSpeed,
      uploadSpeed: torrent.uploadSpeed,
      progress: torrent.progress,
      numPeers: torrent.numPeers,
      timeRemaining: torrent.timeRemaining,
    });

    tickCount++;
    if (tickCount % 5 === 0) {
      db.update(torrents).set({
        downloaded: torrent.downloaded,
        uploaded: torrent.uploaded,
      }).where(eq(torrents.infoHash, torrent.infoHash)).run();
    }
  }, 1000);

  progressIntervals.set(torrent.infoHash, interval);
}

export function pauseTorrent(infoHash: string) {
  const torrent = findTorrent(infoHash);
  if (torrent) {
    torrent.destroy();
    torrentMap.delete(infoHash);
  }
  const interval = progressIntervals.get(infoHash);
  if (interval) {
    clearInterval(interval);
    progressIntervals.delete(infoHash);
  }
  db.update(torrents).set({ status: 'paused' }).where(eq(torrents.infoHash, infoHash)).run();
}

export function resumeTorrent(infoHash: string) {
  const row = db.select().from(torrents).where(eq(torrents.infoHash, infoHash)).get();
  if (!row) throw new Error('Torrent not found');
  const src = row.magnet || (row.torrentFile ? Buffer.from(row.torrentFile, 'base64') : null);
  if (!src) throw new Error('No source available');

  db.update(torrents).set({ status: 'downloading' }).where(eq(torrents.infoHash, infoHash)).run();
  addToEngine(src, row.savePath);
}

export async function removeTorrent(infoHash: string, deleteFiles = false) {
  const torrent = findTorrent(infoHash);
  const row = db.select().from(torrents).where(eq(torrents.infoHash, infoHash)).get();
  const torrentName = torrent?.name || row?.name;
  const savePath = row?.savePath;

  if (torrent) {
    await new Promise<void>((resolve) => {
      torrent.destroy({ destroyStore: deleteFiles }, () => resolve());
    });
    torrentMap.delete(infoHash);
  }

  // Remove the torrent's folder after destroy has completed
  if (deleteFiles && savePath && torrentName) {
    const torrentDir = path.join(savePath, torrentName);
    try {
      fs.rmSync(torrentDir, { recursive: true, force: true });
    } catch {}
  }

  const interval = progressIntervals.get(infoHash);
  if (interval) {
    clearInterval(interval);
    progressIntervals.delete(infoHash);
  }
  db.delete(torrents).where(eq(torrents.infoHash, infoHash)).run();
  torrentEvents.emit('torrent:removed', { infoHash });
}

export function getTorrentStatus(infoHash: string) {
  const torrent = findTorrent(infoHash);
  const row = db.select().from(torrents).where(eq(torrents.infoHash, infoHash)).get();
  if (!row) return null;

  return {
    ...row,
    downloadSpeed: torrent?.downloadSpeed || 0,
    uploadSpeed: torrent?.uploadSpeed || 0,
    progress: torrent?.progress || (row.totalSize > 0 ? row.downloaded / row.totalSize : 0),
    numPeers: torrent?.numPeers || 0,
    timeRemaining: torrent?.timeRemaining || Infinity,
    files: torrent?.files.map((f, i) => ({ index: i, name: f.name, length: f.length, downloaded: f.downloaded })) || [],
  };
}

export function getAllTorrents() {
  const rows = db.select().from(torrents).all();
  return rows.map(row => {
    const t = torrentMap.get(row.infoHash);
    return {
      ...row,
      downloadSpeed: t?.downloadSpeed || 0,
      uploadSpeed: t?.uploadSpeed || 0,
      progress: t?.progress || (row.totalSize > 0 ? row.downloaded / row.totalSize : 0),
      numPeers: t?.numPeers || 0,
    };
  });
}
