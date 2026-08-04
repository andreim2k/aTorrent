import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { torrentEvents, TorrentEventName } from '../engine/events.js';

const clients = new Set<WebSocket>();

/** Telemetry is open — any client that can reach /ws receives the event stream. */
export function setupWebSocket(app: FastifyInstance) {
  app.get('/ws', { websocket: true }, (socket) => {
    clients.add(socket);
    socket.on('close', () => clients.delete(socket));
    socket.on('error', () => clients.delete(socket));
  });

  const events: TorrentEventName[] = [
    'torrent:added', 'torrent:removed', 'torrent:progress',
    'torrent:done', 'torrent:error', 'torrent:metadata', 'torrent:identified',
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
