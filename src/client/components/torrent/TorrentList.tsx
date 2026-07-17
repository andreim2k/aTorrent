import { useTorrents } from '../../hooks/useTorrents.js';
import { useUIStore } from '../../stores/uiStore.js';
import { TorrentCard } from './TorrentCard.js';
import { AnimatePresence, motion } from 'framer-motion';
import type { Torrent } from '../../types/index.js';

export function TorrentList() {
  const { data: torrents, isLoading } = useTorrents();
  const { filterStatus, searchQuery } = useUIStore();
  let filtered = torrents || [];
  if (filterStatus !== 'all') filtered = filterStatus === 'completed' ? filtered.filter((torrent: Torrent) => torrent.status === 'seeding' || torrent.progress >= 1) : filtered.filter((torrent: Torrent) => torrent.status === filterStatus);
  if (searchQuery) filtered = filtered.filter((torrent: Torrent) => torrent.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <section className="terminal-panel transfer-panel">
      <div className="panel-titlebar">
        <div><span className="panel-index">[ JOBS.02 ]</span><strong>TRANSFER QUEUE</strong><small>{filterStatus.toUpperCase()} / {String(filtered.length).padStart(2, '0')} ITEMS</small></div>
        <div className="queue-actions"><span>SORT: ACTIVITY</span><span>VIEW: DENSE</span></div>
      </div>
      <div className="torrent-columns"><span>JOB / PAYLOAD</span><span>PROGRESS</span><span>RATE</span><span>STATE</span><span /></div>
      <div className="torrent-stack">
        {isLoading && [1, 2, 3].map((item) => <div key={item} className="torrent-skeleton" />)}
        {!isLoading && filtered.length === 0 && <div className="terminal-empty"><pre>{`┌────────────────────┐\n│  QUEUE IS EMPTY    │\n└────────────────────┘`}</pre><p>$ add a torrent to initialize transfer<span className="cursor-block" /></p></div>}
        <AnimatePresence mode="popLayout">
          {filtered.map((torrent: Torrent, index: number) => (
            <motion.div key={torrent.infoHash} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }}>
              <TorrentCard torrent={torrent} index={index + 1} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
