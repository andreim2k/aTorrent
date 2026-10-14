import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../stores/uiStore.js';
import { useVisibleTorrents, useBatchPause, useBatchResume } from '../../hooks/useTorrents.js';

const iconProps = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function ActionButton({ label, onClick, disabled, tone, children }: {
  label: string; onClick: () => void; disabled: boolean; tone: 'neutral' | 'danger'; children: React.ReactNode;
}) {
  const colors = tone === 'danger'
    ? 'text-red-400 hover:bg-red-500/20 hover:shadow-[0_0_16px_rgba(239,68,68,0.35)]'
    : 'text-white/80 hover:bg-white/[0.12] hover:shadow-[0_0_16px_rgba(99,102,241,0.35)]';
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.9 }}
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-30 disabled:pointer-events-none max-md:flex-col max-md:gap-0.5 max-md:px-3 max-md:text-[10px] ${colors}`}
      title={label}
    >
      {children}
      <span>{label}</span>
    </motion.button>
  );
}

export function BulkActionBar() {
  const { selectedTorrents, selectionMode, deselectAllTorrents, selectAllTorrents, setDeleteConfirmHashes, setSelectionMode } = useUIStore();
  const { torrents } = useVisibleTorrents();
  const batchPause = useBatchPause();
  const batchResume = useBatchResume();
  const count = selectedTorrents.size;
  const hashes = Array.from(selectedTorrents);
  const allHashes = torrents.map(t => t.infoHash);
  const allSelected = allHashes.length > 0 && count === allHashes.length;

  // Keyboard: Esc leaves selection mode, Ctrl/Cmd+A selects everything visible, Delete opens the confirm
  useEffect(() => {
    if (!selectionMode) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Escape') deselectAllTorrents();
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectAllTorrents(allHashes);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && count > 0) {
        setDeleteConfirmHashes(hashes);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <AnimatePresence>
      {selectionMode && (
        <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center pointer-events-none max-md:bottom-0">
        <motion.div
          className="pointer-events-auto rounded-2xl p-[1px] bg-gradient-to-r from-accent-indigo/60 via-accent-purple/60 to-accent-pink/60 shadow-2xl shadow-accent-indigo/20
            max-md:w-full max-md:rounded-b-none"
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        >
          <div className="glass rounded-2xl bg-base-50/90 backdrop-blur-xl px-3 py-2 flex items-center gap-1 max-md:justify-around max-md:rounded-b-none">
            {/* Count badge */}
            <div className="flex items-center gap-2 pl-1 pr-3 mr-1 border-r border-white/[0.08] max-md:hidden">
              <div className="relative h-8 min-w-8 px-2 rounded-lg bg-gradient-to-br from-accent-indigo to-accent-purple flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={count}
                    className="text-sm font-bold font-mono"
                    initial={{ y: 14, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -14, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {count}
                  </motion.span>
                </AnimatePresence>
              </div>
              <span className="text-xs text-white/50 leading-tight">
                selected<br /><span className="text-white/30">of {allHashes.length}</span>
              </span>
            </div>

            <ActionButton
              label={allSelected ? 'None' : 'All'}
              tone="neutral"
              disabled={allHashes.length === 0}
              onClick={() => allSelected ? setSelectionMode(true) : selectAllTorrents(allHashes)}
            >
              <svg {...iconProps}><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
            </ActionButton>
            <ActionButton label="Pause" tone="neutral" disabled={count === 0} onClick={() => batchPause.mutate(hashes)}>
              <svg {...iconProps}><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
            </ActionButton>
            <ActionButton label="Resume" tone="neutral" disabled={count === 0} onClick={() => batchResume.mutate(hashes)}>
              <svg {...iconProps}><polygon points="5 3 19 12 5 21 5 3" /></svg>
            </ActionButton>
            <div className="w-px h-6 bg-white/[0.08] mx-1" />
            <ActionButton label="Delete" tone="danger" disabled={count === 0} onClick={() => setDeleteConfirmHashes(hashes)}>
              <svg {...iconProps}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
            </ActionButton>
            <button
              onClick={deselectAllTorrents}
              className="ml-1 w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white/90 hover:bg-white/[0.08] transition-all"
              title="Close (Esc)"
            >
              <svg {...iconProps} width={14} height={14}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
