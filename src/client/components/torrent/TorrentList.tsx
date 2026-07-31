import { AnimatePresence, motion } from 'framer-motion';
import { useTorrents } from '../../hooks/useTorrents.js';
import { useUIStore } from '../../stores/uiStore.js';
import { TorrentCard } from './TorrentCard.js';
import type { Torrent } from '../../types/index.js';

export function TorrentList() {
  const { data: torrents, isLoading } = useTorrents();
  const { filterStatus, searchQuery } = useUIStore();

  let filtered = torrents || [];
  if (filterStatus !== 'all') {
    filtered = filterStatus === 'completed'
      ? filtered.filter((t: Torrent) => t.status === 'seeding' || t.progress >= 1)
      : filtered.filter((t: Torrent) => t.status === filterStatus);
  }
  if (searchQuery) {
    filtered = filtered.filter((t: Torrent) => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }

  return (
    <section className="holo-panel">
      <div className="holo-panel__bar">
        <div className="holo-panel__id">
          <span className="holo-panel__index">QUE·02</span>
          <h2 className="holo-panel__title">Transfer Queue</h2>
        </div>
        <div className="holo-panel__meta">
          <span className="holo-label">
            {filterStatus} · {String(filtered.length).padStart(2, '0')} items
          </span>
        </div>
      </div>

      <div className="holo-cols holo-label" aria-hidden="true">
        <span>Payload</span>
        <span>Progress</span>
        <span className="col-rate">Rate</span>
        <span>State</span>
        <span />
      </div>

      <div className="holo-queue">
        {isLoading && [0, 1, 2].map((n) => <div key={n} className="holo-skeleton" />)}

        {!isLoading && filtered.length === 0 && (
          <div className="holo-empty">
            <div className="holo-empty__mark">◇</div>
            <div>
              <p style={{ fontWeight: 500, marginBottom: 4 }}>
                {searchQuery ? 'No matching transfers' : 'Queue is empty'}
              </p>
              <p className="holo-label">
                {searchQuery ? 'Adjust the filter to widen results' : 'Add a torrent to begin a transfer'}
              </p>
            </div>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {filtered.map((torrent: Torrent, index: number) => (
            <motion.div
              key={torrent.infoHash}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
            >
              <TorrentCard torrent={torrent} index={index + 1} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
