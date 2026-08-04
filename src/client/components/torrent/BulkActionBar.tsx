import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../stores/uiStore.js';
import { useFilteredTorrents } from '../../hooks/useFilteredTorrents.js';
import { useBatchPause, useBatchResume } from '../../hooks/useTorrents.js';
import type { Torrent } from '../../types/index.js';

const RUNNING = new Set(['downloading', 'seeding']);

export function BulkActionBar() {
  const {
    selectedTorrents, selectionMode,
    selectAllTorrents, clearSelection, exitSelectionMode, setDeleteConfirmHashes,
  } = useUIStore();
  const { torrents } = useFilteredTorrents();
  const batchPause = useBatchPause();
  const batchResume = useBatchResume();

  const hashes = Array.from(selectedTorrents);
  const count = hashes.length;

  // Scope every bulk action to the transfers actually on screen.
  const visible = torrents.map((t: Torrent) => t.infoHash);
  const allSelected = visible.length > 0 && visible.every((h) => selectedTorrents.has(h));

  // Act on the subset each verb applies to, so Pause never ships already-paused
  // hashes to the server. The counts are the affordance — a greyed-out button
  // reads as broken, so these stay live whenever anything is selected.
  const chosen = torrents.filter((t: Torrent) => selectedTorrents.has(t.infoHash));
  const running = chosen.filter((t: Torrent) => RUNNING.has(t.status)).map((t: Torrent) => t.infoHash);
  const stopped = chosen.filter((t: Torrent) => !RUNNING.has(t.status)).map((t: Torrent) => t.infoHash);

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
            onClick={() => (allSelected ? clearSelection() : selectAllTorrents(visible))}
            disabled={visible.length === 0}
          >
            {allSelected ? 'Deselect all' : `Select all ${visible.length}`}
          </button>

          <span className="holo-dock__sep" aria-hidden="true" />

          {/* The count is always rendered, including zero: a greyed "Pause 0"
              explains itself, where a bare greyed "Pause" reads as broken. */}
          <button
            className="holo-btn"
            onClick={() => batchPause.mutate(running)}
            disabled={running.length === 0}
            title={`${running.length} of ${count} selected are running`}
          >
            Pause <b className="holo-btn__n">{running.length}</b>
          </button>

          <button
            className="holo-btn"
            onClick={() => batchResume.mutate(stopped)}
            disabled={stopped.length === 0}
            title={`${stopped.length} of ${count} selected are stopped`}
          >
            Resume <b className="holo-btn__n">{stopped.length}</b>
          </button>

          <button
            className="holo-btn holo-btn--danger"
            onClick={() => setDeleteConfirmHashes(hashes)}
            disabled={count === 0}
          >
            Remove <b className="holo-btn__n">{count}</b>
          </button>

          <button className="holo-icon-btn" onClick={exitSelectionMode} aria-label="Leave selection mode">
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
