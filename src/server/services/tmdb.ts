import { config } from '../config.js';
import { db } from '../db/client.js';
import { tmdbCache } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const TMDB_BASE = 'https://api.themoviedb.org/3';

async function fetchTMDB(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  if (!config.tmdbApiKey) return null;

  const cacheKey = endpoint + '?' + new URLSearchParams(params).toString();

  // Check cache
  const cached = db.select().from(tmdbCache).where(eq(tmdbCache.cacheKey, cacheKey)).get();
  if (cached) {
    const age = Date.now() - (cached.fetchedAt as any as number) * 1000;
    if (age < config.tmdbCacheTTL) {
      return JSON.parse(cached.data);
    }
  }

  const url = new URL(TMDB_BASE + endpoint);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${config.tmdbApiKey}`, Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const data = await res.json();

  // Store cache
  db.insert(tmdbCache).values({
    cacheKey,
    data: JSON.stringify(data),
    fetchedAt: new Date(),
  }).onConflictDoUpdate({
    target: tmdbCache.cacheKey,
    set: { data: JSON.stringify(data), fetchedAt: new Date() },
  }).run();

  return data;
}

export async function searchTMDB(query: string, type?: 'movie' | 'tv') {
  const endpoint = type ? `/search/${type}` : '/search/multi';
  return fetchTMDB(endpoint, { query });
}

export async function getTMDBDetails(id: number, type: 'movie' | 'tv') {
  return fetchTMDB(`/${type}/${id}`, { append_to_response: 'credits,images' });
}
