import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../stores/uiStore.js';
import { useTorrents, useBatchPause, useBatchResume } from '../../hooks/useTorrents.js';
import type { Torrent } from '../../types/index.js';

export function BulkActionBar() {
  const { selectedTorrents, selectionMode, deselectAllTorrents, selectAllTorrents, setDeleteConfirmHashes } = useUIStore();
  const { data: torrents } = useTorrents();
  const batchPause = useBatchPause();
  const batchResume = useBatchResume();

  const count = selectedTorrents.size;
  const hashes = Array.from(selectedTorrents);
  const allHashes = torrents?.map((t: Torrent) => t.infoHash) || [];
  const allSelected = allHashes.length > 0 && count === allHashes.length;

  return (
    <AnimatePresence>
      {selectionMode && (
        <motion.div
          className="holo-dock"
          initial={{ y: 70, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 70, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        >
          <span className="holo-dock__count">{String(count).padStart(2, '0')} selected</span>

          <button
            className="holo-btn"
            onClick={() => (allSelected ? deselectAllTorrents() : selectAllTorrents(allHashes))}
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>

          <button className="holo-btn" onClick={() => batchPause.mutate(hashes)} disabled={count === 0}>
            Pause
          </button>

          <button className="holo-btn" onClick={() => batchResume.mutate(hashes)} disabled={count === 0}>
            Resume
          </button>

          <button
            className="holo-btn holo-btn--danger"
            onClick={() => setDeleteConfirmHashes(hashes)}
            disabled={count === 0}
          >
            Remove
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
