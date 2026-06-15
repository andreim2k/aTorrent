import { FastifyInstance } from 'fastify';
import { addTorrent, getAllTorrents, getTorrentStatus, pauseTorrent, resumeTorrent, removeTorrent } from '../engine/torrent-manager.js';
import { db } from '../db/client.js';
import { torrents } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { autoIdentify } from '../services/media-identifier.js';
import { config } from '../config.js';
import { getTMDBDetails } from '../services/tmdb.js';
import path from 'path';

export function torrentRoutes(app: FastifyInstance) {
  // List all torrents
  app.get('/api/torrents', async (req) => {
    const { status, category } = req.query as any;
    let all = getAllTorrents();
    if (status) all = all.filter(t => t.status === status);
    if (category) all = all.filter(t => t.categoryId === parseInt(category));
    return all;
  });

  // Get single torrent
  app.get('/api/torrents/:hash', async (req, reply) => {
    const { hash } = req.params as any;
    const torrent = getTorrentStatus(hash);
    if (!torrent) return reply.status(404).send({ error: 'Not found' });
    return torrent;
  });

  // Add torrent (magnet link or .torrent file)
  app.post('/api/torrents', async (req, reply) => {
    const contentType = req.headers['content-type'] || '';

    let savePath = config.downloadsDir;

    const addedResults: any[] = [];

    if (contentType.includes('multipart')) {
      // Use req.files() to get ALL files (req.file() only returns the first one)
      let fileIndex = 0;
      for await (const file of req.files()) {
        fileIndex++;
        console.log(`[Multipart Upload] file #${fileIndex}: filename=${file.filename}, mimetype=${file.mimetype}, encoding=${file.encoding}`);
        const buf = Buffer.from(await file.toBuffer());
        try {
          const res = addTorrent(buf, savePath);
          autoIdentify(res.infoHash, res.name).catch(err =>
            console.warn('[AutoIdentify] Failed:', err.message || err)
          );
          addedResults.push(res);
        } catch (err: any) {
          addedResults.push({ error: err.message });
        }
      }
      console.log(`[Multipart Upload] total files drained from this request: ${fileIndex}, addedResults.length=${addedResults.length}`);
      if (addedResults.length === 0) {
        return reply.status(400).send({ error: 'No file uploaded' });
      }
      // For backward compat with single-file callers, return the single result
      // shape when exactly one file arrived in this request.
      return addedResults.length === 1 ? addedResults[0] : { ok: true, results: addedResults };
    } else {
      const body = req.body as any;
      if (!body?.magnet) return reply.status(400).send({ error: 'magnet required' });
      const source: string | Buffer = body.magnet;
      if (body.savePath) {
        const resolved = path.resolve(body.savePath);
        const downloadsRoot = path.resolve(config.downloadsDir);
        if (!resolved.startsWith(downloadsRoot + path.sep) && resolved !== downloadsRoot) {
          return reply.status(400).send({ error: 'savePath must be within downloads directory' });
        }
        savePath = resolved;
      }

      try {
        const result = addTorrent(source, savePath);

        // Auto-identify in background
        autoIdentify(result.infoHash, result.name).catch(err => console.warn('[AutoIdentify] Failed:', err.message || err));

        return result;
      } catch (err: any) {
        return reply.status(500).send({ error: err.message });
      }
    }
  });

  // Update torrent (pause/resume/category)

  // Batch pause
  app.post('/api/torrents/batch/pause', async (req) => {
    const { hashes } = req.body as { hashes: string[] };
    for (const hash of hashes) {
      try { pauseTorrent(hash); } catch {}
    }
    return { ok: true };
  });

  // Batch resume
  app.post('/api/torrents/batch/resume', async (req) => {
    const { hashes } = req.body as { hashes: string[] };
    for (const hash of hashes) {
      try { resumeTorrent(hash); } catch {}
    }
    return { ok: true };
  });

  // Batch delete
  app.post('/api/torrents/batch/delete', async (req) => {
    const { hashes, deleteFiles } = req.body as { hashes: string[]; deleteFiles: boolean };
    for (const hash of hashes) {
      try { await removeTorrent(hash, deleteFiles); } catch {}
    }
    return { ok: true };
  });
  app.patch('/api/torrents/:hash', async (req, reply) => {
    const { hash } = req.params as any;
    const body = req.body as any;

    if (body.status === 'paused') {
      pauseTorrent(hash);
    } else if (body.status === 'downloading') {
      try {
        resumeTorrent(hash);
      } catch (err: any) {
        return reply.status(400).send({ error: err.message });
      }
    }

    if (body.categoryId !== undefined) {
      db.update(torrents).set({ categoryId: body.categoryId })
        .where(eq(torrents.infoHash, hash)).run();
    }

    return { ok: true };
  });

  // Delete torrent
  app.delete('/api/torrents/:hash', async (req) => {
    const { hash } = req.params as any;
    const { deleteFiles } = req.query as any;
    await removeTorrent(hash, deleteFiles === 'true');
    return { ok: true };
  });

  // Get torrent files
  app.get('/api/torrents/:hash/files', async (req, reply) => {
    const { hash } = req.params as any;
    const torrent = getTorrentStatus(hash);
    if (!torrent) return reply.status(404).send({ error: 'Not found' });
    return torrent.files;
  });

  // Manual TMDB link
  app.post('/api/torrents/:hash/identify', async (req) => {
    const { hash } = req.params as any;
    const { tmdbId, mediaType } = req.body as any;
    db.update(torrents).set({ tmdbId, mediaType })
      .where(eq(torrents.infoHash, hash)).run();
    return { ok: true };
  });

  // Get TMDB details for a torrent
  app.get('/api/torrents/:hash/tmdb', async (req, reply) => {
    const { hash } = req.params as any;
    const torrent = getTorrentStatus(hash);
    if (!torrent) return reply.status(404).send({ error: 'Not found' });
    if (!torrent.tmdbId || !torrent.mediaType) return reply.status(404).send({ error: 'No TMDB data' });
    const details = await getTMDBDetails(torrent.tmdbId, torrent.mediaType);
    if (!details) return reply.status(404).send({ error: 'TMDB fetch failed' });
    return details;
  });
}
