import { EventEmitter } from 'events';

export interface TorrentEvents {
  'torrent:added': { infoHash: string; name: string };
  'torrent:removed': { infoHash: string };
  'torrent:progress': {
    infoHash: string;
    downloaded: number;
    uploaded: number;
    downloadSpeed: number;
    uploadSpeed: number;
    progress: number;
    numPeers: number;
    timeRemaining: number;
  };
  'torrent:done': { infoHash: string };
  'torrent:error': { infoHash: string; message: string };
  'torrent:metadata': { infoHash: string; name: string; totalSize: number; files: { name: string; length: number }[] };
}

export type TorrentEventName = keyof TorrentEvents;

class TypedEmitter extends EventEmitter {
  emit<K extends TorrentEventName>(event: K, data: TorrentEvents[K]): boolean {
    return super.emit(event, data);
  }
  on<K extends TorrentEventName>(event: K, listener: (data: TorrentEvents[K]) => void): this {
    return super.on(event, listener);
  }
}

export const torrentEvents = new TypedEmitter();
torrentEvents.setMaxListeners(100);
