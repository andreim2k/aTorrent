import { useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFilteredTorrents } from '../../hooks/useFilteredTorrents.js';
import { useUIStore } from '../../stores/uiStore.js';
import { TorrentCard } from './TorrentCard.js';
import type { Torrent } from '../../types/index.js';

export function TorrentList() {
  const { torrents: filtered, isLoading } = useFilteredTorrents();
  const {
    filterStatus, searchQuery,
    selectedTorrents, selectAllTorrents, clearSelection, toggleTorrentSelection, selectRange,
  } = useUIStore();

  const visibleHashes = filtered.map((t: Torrent) => t.infoHash);
  const selectedVisible = visibleHashes.filter((h) => selectedTorrents.has(h)).length;
  const allSelected = visibleHashes.length > 0 && selectedVisible === visibleHashes.length;

  // Shared by every row's checkbox and shift-click: plain click toggles one
  // transfer, shift-click extends the range from the last anchor.
  const handleSelect = (hash: string, shiftKey: boolean) => {
    if (shiftKey) selectRange(visibleHashes, hash);
    else toggleTorrentSelection(hash);
  };

  // Partial selection is a third state the checkbox element only exposes via JS.
  const headCheck = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headCheck.current) {
      headCheck.current.indeterminate = selectedVisible > 0 && !allSelected;
    }
  }, [selectedVisible, allSelected]);

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

      <div className="holo-cols holo-label">
        <span className="holo-cols__lead">
          <input
            ref={headCheck}
            type="checkbox"
            className="holo-check"
            checked={allSelected}
            onChange={() => (allSelected ? clearSelection() : selectAllTorrents(visibleHashes))}
            aria-label={allSelected ? 'Deselect all visible transfers' : 'Select all visible transfers'}
          />
          <span>Payload</span>
        </span>
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
          {filtered.map((torrent: Torrent) => (
            <motion.div
              key={torrent.infoHash}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
            >
              <TorrentCard torrent={torrent} onSelect={handleSelect} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
