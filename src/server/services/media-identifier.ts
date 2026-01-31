import * as ptnModule from 'parse-torrent-title';
const ptn = (ptnModule as any).parse || (ptnModule as any).default || ptnModule;
import { searchTMDB } from './tmdb.js';
import { db } from '../db/client.js';
import { torrents } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export async function autoIdentify(infoHash: string, torrentName: string) {
  const parsed = ptn(torrentName);
  if (!parsed.title) return null;

  const query = parsed.title;
  const type = parsed.season !== undefined ? 'tv' : 'movie';
  const year = parsed.year;

  const results = await searchTMDB(query, type);
  if (!results?.results?.length) return null;

  // If we have a year from the torrent name, try to match it
  let best = results.results[0];
  if (year) {
    const yearMatch = results.results.find((r: any) => {
      const rYear = (r.release_date || r.first_air_date || '').slice(0, 4);
      return rYear === String(year);
    });
    if (yearMatch) best = yearMatch;
  }

  const tmdbId = best.id;
  db.update(torrents).set({ tmdbId, mediaType: type, posterPath: best.poster_path })
    .where(eq(torrents.infoHash, infoHash)).run();
  return { tmdbId, mediaType: type, title: best.title || best.name, posterPath: best.poster_path };
}
