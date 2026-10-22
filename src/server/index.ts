import 'dotenv/config';
import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastifyWebsocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyCompress from '@fastify/compress';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { runMigrations } from './db/migrate.js';
import { initEngine } from './engine/torrent-manager.js';
import { registerRoutes } from './api/router.js';
import { setupWebSocket } from './ws/handler.js';
import { loadSettingsFromDB } from './api/settings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  // Run DB migrations
  runMigrations();

  // Load persisted settings into runtime config
  loadSettingsFromDB();

  // Init torrent engine
  initEngine();

  const app = Fastify({ logger: true });

  await app.register(fastifyCors, {
    credentials: true,
    origin: (origin, cb) => {
      const allowed = process.env.CORS_ORIGIN;
      if (!allowed) {
        // In dev, allow all; in prod, only same-origin (no origin header)
        if (process.env.NODE_ENV !== 'production' || !origin) return cb(null, true);
        return cb(new Error('CORS not allowed'), false);
      }
      const origins = allowed.split(',').map(s => s.trim());
      if (!origin || origins.includes(origin)) return cb(null, true);
      cb(new Error('CORS not allowed'), false);
    }
  });
  await app.register(fastifyMultipart, { limits: { fileSize: 50 * 1024 * 1024 } });
  await app.register(fastifyWebsocket);
  // gzip/brotli for JSON and static assets: the client bundle drops from ~490 KB to ~150 KB on the wire
  await app.register(fastifyCompress);
  // The UI is a live dashboard, so the global ceiling is generous
  await app.register(fastifyRateLimit, { max: 1200, timeWindow: '1 minute' });

  // API routes
  registerRoutes(app);

  // WebSocket
  setupWebSocket(app);

  // Serve built client in production
  const clientDist = path.resolve(__dirname, '../client');
  await app.register(fastifyStatic, {
    root: clientDist,
    cacheControl: false, // we set it ourselves below (the plugin's own header would overwrite ours)
    // Vite fingerprints everything under /assets, so it can be cached forever; index.html must always be revalidated
    setHeaders: (res, filePath) => {
      const immutable = filePath.includes(`${path.sep}assets${path.sep}`);
      res.setHeader('cache-control', immutable ? 'public, max-age=31536000, immutable' : 'no-cache');
    },
  });

  // SPA fallback. Missing assets and API routes must 404 rather than return the HTML shell,
  // otherwise a stale script URL surfaces as a confusing MIME-type error.
  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith('/api/') || req.url.startsWith('/assets/')) {
      return reply.status(404).send({ error: 'Not found' });
    }
    return reply.sendFile('index.html');
  });

  await app.listen({ port: config.port, host: config.host });
  console.log(`aTorrent server running on http://localhost:${config.port}`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
