import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  savePath: text('save_path'),
});

export const torrents = sqliteTable('torrents', {
  infoHash: text('info_hash').primaryKey(),
  name: text('name').notNull(),
  magnet: text('magnet'),
  torrentFile: text('torrent_file'), // base64
  savePath: text('save_path').notNull(),
  categoryId: integer('category_id').references(() => categories.id),
  status: text('status', { enum: ['downloading', 'seeding', 'paused', 'error', 'queued', 'checking'] }).notNull().default('queued'),
  totalSize: integer('total_size').notNull().default(0),
  downloaded: integer('downloaded').notNull().default(0),
  uploaded: integer('uploaded').notNull().default(0),
  addedAt: integer('added_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  tmdbId: integer('tmdb_id'),
  mediaType: text('media_type', { enum: ['movie', 'tv'] }),
  posterPath: text('poster_path'),
}, (table) => [
  index('idx_torrents_status').on(table.status),
  index('idx_torrents_category_id').on(table.categoryId),
]);

export const tmdbCache = sqliteTable('tmdb_cache', {
  cacheKey: text('cache_key').primaryKey(),
  data: text('data').notNull(), // JSON
  fetchedAt: integer('fetched_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(), // JSON
});
