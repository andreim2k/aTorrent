import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.js';
import { torrentRoutes } from './torrents.js';
import { fileRoutes } from './files.js';
import { categoryRoutes } from './categories.js';
import { settingsRoutes } from './settings.js';
import { tmdbRoutes } from './tmdb.js';

export function registerRoutes(app: FastifyInstance) {
  authRoutes(app);
  torrentRoutes(app);
  fileRoutes(app);
  categoryRoutes(app);
  settingsRoutes(app);
  tmdbRoutes(app);
}
