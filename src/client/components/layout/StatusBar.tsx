import { useTorrents } from '../../hooks/useTorrents.js';

export function StatusBar() {
  const { data: torrents } = useTorrents();
  const count = torrents?.length || 0;

  return (
    <footer className="h-8 glass border-t border-white/[0.06] flex items-center px-4 text-xs text-white/30 font-mono gap-6">
      <span>{count} torrent{count !== 1 ? 's' : ''}</span>
      <span>aTorrent v0.1.0</span>
    </footer>
  );
}
