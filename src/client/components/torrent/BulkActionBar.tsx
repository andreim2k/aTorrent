import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../stores/uiStore.js';
import { useFilteredTorrents } from '../../hooks/useFilteredTorrents.js';
import { useBatchPause, useBatchResume } from '../../hooks/useTorrents.js';
import type { Torrent } from '../../types/index.js';

export function BulkActionBar() {
  const {
    selectedTorrents,
    selectAllTorrents, clearSelection, setDeleteConfirmHashes,
  } = useUIStore();
  const { torrents } = useFilteredTorrents();
  const batchPause = useBatchPause();
  const batchResume = useBatchResume();

  const hashes = Array.from(selectedTorrents);
  const count = hashes.length;

  // Scope every bulk action to the transfers actually on screen.
  const visible = torrents.map((t: Torrent) => t.infoHash);
  const allSelected = visible.length > 0 && visible.every((h) => selectedTorrents.has(h));

  // Act on the subset each verb applies to, so Pause never ships an already-paused
  // hash to the server, and Stop Seeding never touches a still-downloading one.
  // The counts are the affordance — a greyed-out button reads as broken, so these
  // stay live whenever anything is selected.
  const chosen = torrents.filter((t: Torrent) => selectedTorrents.has(t.infoHash));
  const downloading = chosen.filter((t: Torrent) => t.status === 'downloading').map((t: Torrent) => t.infoHash);
  const seeding = chosen.filter((t: Torrent) => t.status === 'seeding').map((t: Torrent) => t.infoHash);
  const stopped = chosen.filter((t: Torrent) => t.status === 'paused').map((t: Torrent) => t.infoHash);

  // Esc clears the selection from anywhere — this bar is always mounted, so it's
  // the one place that needs to listen, regardless of what else has focus.
  useEffect(() => {
    if (count === 0) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') clearSelection();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [count, clearSelection]);

  return (
    <AnimatePresence>
      {count > 0 && (
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
              explains itself, where a bare greyed "Pause" reads as broken. Pause
              and Stop Seeding both call the pause endpoint under the hood — the
              engine instance is torn down either way — but they're kept as
              separate verbs since a downloading and a seeding transfer read as
              different actions to stop. */}
          <button
            className="holo-btn"
            onClick={() => batchPause.mutate(downloading)}
            disabled={downloading.length === 0}
            title={`${downloading.length} of ${count} selected are downloading`}
          >
            Pause <b className="holo-btn__n">{downloading.length}</b>
          </button>

          <button
            className="holo-btn"
            onClick={() => batchPause.mutate(seeding)}
            disabled={seeding.length === 0}
            title={`${seeding.length} of ${count} selected are seeding`}
          >
            Stop Seed <b className="holo-btn__n">{seeding.length}</b>
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

          <button className="holo-icon-btn" onClick={clearSelection} aria-label="Clear selection">
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
