import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../stores/uiStore.js';
import { useTorrents, useBatchPause, useBatchResume } from '../../hooks/useTorrents.js';

export function BulkActionBar() {
  const { selectedTorrents, selectionMode, deselectAllTorrents, selectAllTorrents, setDeleteConfirmHashes } = useUIStore();
  const { data: torrents } = useTorrents();
  const batchPause = useBatchPause();
  const batchResume = useBatchResume();
  const count = selectedTorrents.size;
  const hashes = Array.from(selectedTorrents);
  const allHashes = torrents?.map(t => t.infoHash) || [];
  const allSelected = allHashes.length > 0 && count === allHashes.length;

  return (
    <AnimatePresence>
      {selectionMode && (
        <motion.div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 glass rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/50 px-4 py-2.5 flex items-center gap-2
            max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:translate-x-0 max-md:rounded-none max-md:rounded-t-xl max-md:justify-around"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <span className="text-xs text-white/50 font-medium mr-1 max-md:hidden">
            {count} selected
          </span>

          <button
            onClick={() => allSelected ? deselectAllTorrents() : selectAllTorrents(allHashes)}
            className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-xs hover:bg-white/[0.1] transition-colors max-md:px-2"
            title={allSelected ? 'Deselect All' : 'Select All'}
          >
            <span className="max-md:hidden">{allSelected ? 'Deselect All' : 'Select All'}</span>
            <span className="md:hidden text-base">{allSelected ? '☐' : '☑'}</span>
          </button>

          <button
            onClick={() => batchPause.mutate(hashes)}
            disabled={count === 0}
            className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-xs hover:bg-white/[0.1] transition-colors disabled:opacity-30 max-md:flex max-md:flex-col max-md:items-center max-md:gap-0.5 max-md:px-2"
            title="Pause"
          >
            <svg className="md:hidden" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
            </svg>
            <span className="max-md:text-[10px] max-md:text-white/40">Pause</span>
          </button>

          <button
            onClick={() => batchResume.mutate(hashes)}
            disabled={count === 0}
            className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-xs hover:bg-white/[0.1] transition-colors disabled:opacity-30 max-md:flex max-md:flex-col max-md:items-center max-md:gap-0.5 max-md:px-2"
            title="Resume"
          >
            <svg className="md:hidden" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span className="max-md:text-[10px] max-md:text-white/40">Resume</span>
          </button>

          <button
            onClick={() => setDeleteConfirmHashes(hashes)}
            disabled={count === 0}
            className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-colors disabled:opacity-30 max-md:flex max-md:flex-col max-md:items-center max-md:gap-0.5 max-md:px-2"
            title="Delete"
          >
            <svg className="md:hidden" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span className="max-md:text-[10px] max-md:text-red-400/60">Delete</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
