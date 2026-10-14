import { FastifyInstance } from 'fastify';
import path from 'path';
import { getClient } from '../engine/torrent-manager.js';

const MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.mkv': 'video/x-matroska',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.ts': 'video/mp2t',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.flac': 'audio/flac',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.srt': 'text/plain',
  '.vtt': 'text/vtt',
};

function contentTypeFor(name: string): string {
  return MIME_TYPES[path.extname(name).toLowerCase()] || 'application/octet-stream';
}

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
    const contentType = contentTypeFor(file.name);

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? Math.min(parseInt(parts[1], 10), fileSize - 1) : fileSize - 1;
      if (isNaN(start) || start >= fileSize || start > end) {
        return reply.status(416).header('Content-Range', `bytes */${fileSize}`).send();
      }
      const chunkSize = end - start + 1;

      reply.raw.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
      });

      const stream = file.createReadStream({ start, end });
      stream.on('error', () => reply.raw.destroy());
      stream.pipe(reply.raw);
    } else {
      reply.raw.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
      });
      const stream = file.createReadStream();
      stream.on('error', () => reply.raw.destroy());
      stream.pipe(reply.raw);
    }

    return reply;
  });
}
