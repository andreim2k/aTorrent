import { FastifyInstance } from 'fastify';
import { searchTMDB, getTMDBDetails } from '../services/tmdb.js';

export function tmdbRoutes(app: FastifyInstance) {
  app.get('/api/tmdb/search', async (req) => {
    const { q, type } = req.query as any;
    if (!q) return { results: [] };
    return searchTMDB(q, type);
  });

  app.get('/api/tmdb/:type/:id', async (req) => {
    const { type, id } = req.params as any;
    return getTMDBDetails(parseInt(id), type);
  });
}
