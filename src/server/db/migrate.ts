import { sqlite } from './client.js';

export function runMigrations() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      save_path TEXT
    );

    CREATE TABLE IF NOT EXISTS torrents (
      info_hash TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      magnet TEXT,
      torrent_file TEXT,
      save_path TEXT NOT NULL,
      category_id INTEGER REFERENCES categories(id),
      status TEXT NOT NULL DEFAULT 'queued',
      total_size INTEGER NOT NULL DEFAULT 0,
      downloaded INTEGER NOT NULL DEFAULT 0,
      uploaded INTEGER NOT NULL DEFAULT 0,
      added_at INTEGER NOT NULL DEFAULT (unixepoch()),
      completed_at INTEGER,
      tmdb_id INTEGER,
      media_type TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_torrents_status ON torrents(status);
    CREATE INDEX IF NOT EXISTS idx_torrents_category_id ON torrents(category_id);

    CREATE TABLE IF NOT EXISTS tmdb_cache (
      cache_key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      fetched_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}
