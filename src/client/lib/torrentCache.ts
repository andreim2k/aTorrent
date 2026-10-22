import type { Torrent } from '../types/index.js';

const KEY = 'atorrent-library-v1';

// Everything a card needs, nothing heavy (no magnet / .torrent blob / file lists)
const FIELDS: (keyof Torrent)[] = [
  'infoHash', 'name', 'status', 'totalSize', 'downloaded', 'uploaded', 'addedAt', 'completedAt',
  'posterPath', 'tmdbId', 'mediaType', 'progress', 'numPeers', 'savePath',
];

/** The last library we saw, so the page can paint real content before the network answers. */
export function loadCachedTorrents(): { data: Torrent[]; savedAt: number } | undefined {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.data)) return undefined;
    // Speeds are meaningless once stale
    return {
      savedAt: parsed.savedAt,
      data: parsed.data.map((t: Torrent) => ({ ...t, downloadSpeed: 0, uploadSpeed: 0, timeRemaining: 0 })),
    };
  } catch {
    return undefined;
  }
}

export function saveCachedTorrents(list: Torrent[]) {
  try {
    const data = list.map((t) => Object.fromEntries(FIELDS.filter((k) => t[k] !== undefined).map((k) => [k, t[k]])));
    localStorage.setItem(KEY, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // private mode / quota: caching is a nicety, never an error
  }
}
