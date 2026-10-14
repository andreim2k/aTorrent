import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../stores/uiStore.js';
import { useTorrents, useDeleteTorrent, useBatchDelete } from '../../hooks/useTorrents.js';
import { parseRelease } from '../../lib/release.js';
import { Icon } from '../ui/Icon.js';

export function DeleteConfirmModal() {
  const { deleteConfirmHashes, clearDeleteConfirm, setSelectedTorrent, deselectAllTorrents } = useUIStore();
  const { data: torrents } = useTorrents();
  const [deleteFiles, setDeleteFiles] = useState(true);
  const open = deleteConfirmHashes.length > 0;
  const deleteTorrent = useDeleteTorrent();
  const batchDelete = useBatchDelete();
  const isBulk = deleteConfirmHashes.length > 1;

  // Reset to checked every time the modal opens
  useEffect(() => { if (open) setDeleteFiles(true); }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && clearDeleteConfirm();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, clearDeleteConfirm]);

  const names = deleteConfirmHashes
    .map((h) => (torrents || []).find((t: any) => t.infoHash === h)?.name)
    .filter(Boolean)
    .map((n) => parseRelease(n as string).title);

  const handleDelete = () => {
    if (isBulk) {
      batchDelete.mutate({ hashes: deleteConfirmHashes, deleteFiles });
      deselectAllTorrents();
    } else {
      deleteTorrent.mutate({ hash: deleteConfirmHashes[0], deleteFiles });
      setSelectedTorrent(null);
    }
    clearDeleteConfirm();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={clearDeleteConfirm} />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            className="relative glass bg-base-50/90 rounded-2xl p-6 w-full max-w-sm shadow-float"
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-400/20 text-rose-300 flex items-center justify-center mb-4 shadow-[0_0_30px_-4px_rgba(251,113,133,0.5)]">
              <Icon name="trash" size={22} />
            </div>
            <h3 className="text-lg font-semibold tracking-tight">
              {isBulk ? `Remove ${deleteConfirmHashes.length} torrents?` : 'Remove torrent?'}
            </h3>
            <ul className="mt-2 space-y-0.5 text-[13px] text-white/50">
              {names.slice(0, 3).map((n, i) => <li key={i} className="truncate">• {n}</li>)}
              {names.length > 3 && <li className="text-white/30">and {names.length - 3} more</li>}
            </ul>

            <button
              type="button"
              role="switch"
              aria-checked={deleteFiles}
              onClick={() => setDeleteFiles(!deleteFiles)}
              className={`mt-5 w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-colors text-left ${
                deleteFiles ? 'bg-rose-500/10 border-rose-400/25' : 'bg-white/[0.03] border-white/[0.08]'
              }`}
            >
              <span className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${deleteFiles ? 'bg-rose-500' : 'bg-white/15'}`}>
                <motion.span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow" animate={{ left: deleteFiles ? 18 : 2 }} transition={{ type: 'spring', damping: 22, stiffness: 500 }} />
              </span>
              <span>
                <span className="block text-sm text-white/90">Also delete files from disk</span>
                <span className="block text-[11px] text-white/35">{deleteFiles ? 'Downloaded data will be erased' : 'Files will be kept on disk'}</span>
              </span>
            </button>

            <div className="flex gap-2 mt-5">
              <button onClick={clearDeleteConfirm} className="btn-ghost flex-1 h-10 rounded-xl text-sm font-medium">Cancel</button>
              <button
                onClick={handleDelete}
                autoFocus
                className="flex-1 h-10 rounded-xl text-sm font-medium bg-gradient-to-b from-rose-500 to-rose-600 hover:brightness-110 active:scale-[0.97] transition-all shadow-[0_8px_24px_-8px_rgba(244,63,94,0.8),inset_0_1px_0_rgba(255,255,255,0.25)]"
              >
                Remove
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
