import { FastifyInstance } from 'fastify';
import { db } from '../db/client.js';
import { categories } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export function categoryRoutes(app: FastifyInstance) {
  app.get('/api/categories', async () => {
    return db.select().from(categories).all();
  });

  app.post('/api/categories', async (req) => {
    const { name, savePath } = req.body as any;
    const result = db.insert(categories).values({ name, savePath }).run();
    return { id: Number(result.lastInsertRowid), name, savePath };
  });

  app.delete('/api/categories/:id', async (req) => {
    const { id } = req.params as any;
    db.delete(categories).where(eq(categories.id, parseInt(id))).run();
    return { ok: true };
  });
}
