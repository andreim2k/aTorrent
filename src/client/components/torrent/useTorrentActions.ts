import { useUIStore } from '../../stores/uiStore.js';
import { useUpdateTorrent } from '../../hooks/useTorrents.js';
import type { Torrent } from '../../types/index.js';

/** Pause/resume/remove/preview handlers shared by the list row and the poster card. */
export function useTorrentActions(torrent: Torrent) {
  const updateTorrent = useUpdateTorrent();
  const setDeleteConfirmHashes = useUIStore((s) => s.setDeleteConfirmHashes);
  const setPreview = useUIStore((s) => s.setPreview);

  const canPause = torrent.status === 'downloading' || torrent.status === 'seeding';
  const canResume = torrent.status === 'paused';

  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  return {
    canPause,
    canResume,
    togglePause: stop(() => {
      if (canPause) updateTorrent.mutate({ hash: torrent.infoHash, data: { status: 'paused' } });
      else if (canResume) updateTorrent.mutate({ hash: torrent.infoHash, data: { status: 'downloading' } });
    }),
    remove: stop(() => setDeleteConfirmHashes([torrent.infoHash])),
    preview: stop(() => setPreview(torrent.infoHash)),
  };
}

export const TMDB_IMG = 'https://image.tmdb.org/t/p';

/** Stable hue per torrent so poster-less items still get a distinct cover. */
export function hueFor(hash: string): number {
  let h = 0;
  for (let i = 0; i < hash.length; i++) h = (h * 31 + hash.charCodeAt(i)) % 360;
  return h;
}
