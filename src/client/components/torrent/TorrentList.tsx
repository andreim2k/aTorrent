import { useTorrents } from '../../hooks/useTorrents.js';
import { useUIStore } from '../../stores/uiStore.js';
import { TorrentCard } from './TorrentCard.js';
import { AnimatePresence, motion } from 'framer-motion';
import type { Torrent } from '../../types/index.js';

export function TorrentList() {
  const { data: torrents, isLoading } = useTorrents();
  const { filterStatus, searchQuery } = useUIStore();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass rounded-xl p-3 h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  let filtered = torrents || [];

  if (filterStatus !== 'all') {
    if (filterStatus === 'completed') {
      filtered = filtered.filter((t: Torrent) => t.status === 'seeding' || t.progress >= 1);
    } else {
      filtered = filtered.filter((t: Torrent) => t.status === filterStatus);
    }
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((t: Torrent) => t.name.toLowerCase().includes(q));
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16 text-white/30">
        <div className="text-4xl mb-3">◇</div>
        <p>No torrents {filterStatus !== 'all' ? `with status "${filterStatus}"` : 'yet'}</p>
        <p className="text-sm mt-1">Add a torrent to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {filtered.map((t: Torrent) => (
          <motion.div
            key={t.infoHash}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <TorrentCard torrent={t} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
