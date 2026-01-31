import { FastifyInstance } from 'fastify';
import { db } from '../db/client.js';
import { settings } from '../db/schema.js';
import { config, applySettings } from '../config.js';

export function settingsRoutes(app: FastifyInstance) {
  app.get('/api/settings', async () => {
    const rows = db.select().from(settings).all();
    const obj: Record<string, any> = {};
    for (const row of rows) {
      obj[row.key] = JSON.parse(row.value);
    }
    // Include current runtime config values as defaults
    return {
      downloadLimit: 0,
      uploadLimit: 0,
      downloadsDir: config.downloadsDir,
      tmdbApiKey: config.tmdbApiKey,
      ...obj,
    };
  });

  app.patch('/api/settings', async (req) => {
    const body = req.body as Record<string, any>;
    for (const [key, value] of Object.entries(body)) {
      db.insert(settings).values({ key, value: JSON.stringify(value) })
        .onConflictDoUpdate({ target: settings.key, set: { value: JSON.stringify(value) } })
        .run();
    }
    // Apply to running config
    applySettings(body);
    return { ok: true };
  });
}

/** Load settings from DB and apply to runtime config. Call on startup. */
export function loadSettingsFromDB() {
  const rows = db.select().from(settings).all();
  const obj: Record<string, any> = {};
  for (const row of rows) {
    obj[row.key] = JSON.parse(row.value);
  }
  applySettings(obj);
}
