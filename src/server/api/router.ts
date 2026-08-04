import { FastifyInstance } from 'fastify';
import { torrentRoutes } from './torrents.js';
import { fileRoutes } from './files.js';
import { categoryRoutes } from './categories.js';
import { settingsRoutes } from './settings.js';
import { tmdbRoutes } from './tmdb.js';
import { systemRoutes } from './system.js';

/** The API is unauthenticated: every route here is reachable by anyone who can
 *  reach the port. Run this behind a trusted network, VPN or reverse proxy. */
export function registerRoutes(app: FastifyInstance) {
  torrentRoutes(app);
  fileRoutes(app);
  categoryRoutes(app);
  settingsRoutes(app);
  tmdbRoutes(app);
  systemRoutes(app);
}
