import path from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  jwtSecret = randomBytes(64).toString('hex');
  console.warn('[Config] WARNING: JWT_SECRET is not set. Using a random secret — tokens will not survive restarts.');
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  torrentPort: parseInt(process.env.TORRENT_PORT || '6881', 10),
  dataDir: path.resolve(root, 'data'),
  downloadsDir: path.resolve(root, process.env.DOWNLOADS_DIR || 'data/downloads'),
  dbPath: path.resolve(root, 'data/atorrent.db'),
  jwtSecret,
  tmdbApiKey: process.env.TMDB_API_KEY || '',
  tmdbCacheTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/** Apply settings from DB on top of env-based config. */
export function applySettings(s: Record<string, any>) {
  if (s.tmdbApiKey) config.tmdbApiKey = s.tmdbApiKey;
  if (s.downloadsDir) config.downloadsDir = s.downloadsDir;
}
