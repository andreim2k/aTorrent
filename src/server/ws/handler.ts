import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { torrentEvents, TorrentEventName } from '../engine/events.js';
import { verifyToken } from '../services/auth.js';
import { parse as parseCookie } from 'cookie';

const clients = new Set<WebSocket>();

export function setupWebSocket(app: FastifyInstance) {
  app.get('/ws', { websocket: true }, (socket, req) => {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) {
      socket.close(4001, 'Unauthorized');
      return;
    }
    const cookies = parseCookie(cookieHeader);
    const token = cookies.token;
    if (!token || !verifyToken(token)) {
      socket.close(4001, 'Unauthorized');
      return;
    }

    clients.add(socket);
    socket.on('close', () => clients.delete(socket));
    socket.on('error', () => clients.delete(socket));
  });

  const events: TorrentEventName[] = [
    'torrent:added', 'torrent:removed', 'torrent:progress',
    'torrent:done', 'torrent:error', 'torrent:metadata',
  ];

  for (const event of events) {
    torrentEvents.on(event, (data) => {
      const msg = JSON.stringify({ type: event, data });
      for (const ws of clients) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(msg);
        }
      }
    });
  }
}

export function getConnectedClients() {
  return clients.size;
}
