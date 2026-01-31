import { FastifyInstance } from 'fastify';
import { getClient } from '../engine/torrent-manager.js';

export function fileRoutes(app: FastifyInstance) {
  // HTTP range streaming for files
  app.get('/api/files/stream/:hash/:idx', async (req, reply) => {
    const { hash, idx } = req.params as any;
    const torrent = getClient().torrents.find(t => t.infoHash === hash);
    if (!torrent) return reply.status(404).send({ error: 'Torrent not found' });

    const fileIndex = parseInt(idx);
    const file = torrent.files[fileIndex];
    if (!file) return reply.status(404).send({ error: 'File not found' });

    const range = req.headers.range;
    const fileSize = file.length;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      reply.raw.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'application/octet-stream',
      });

      const stream = file.createReadStream({ start, end });
      stream.pipe(reply.raw);
    } else {
      reply.raw.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'application/octet-stream',
        'Accept-Ranges': 'bytes',
      });
      const stream = file.createReadStream();
      stream.pipe(reply.raw);
    }

    return reply;
  });
}
