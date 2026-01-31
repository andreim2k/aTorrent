import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../stores/uiStore.js';
import { useDeleteTorrent, useBatchDelete } from '../../hooks/useTorrents.js';

export function DeleteConfirmModal() {
  const { deleteConfirmHashes, clearDeleteConfirm, setSelectedTorrent, deselectAllTorrents } = useUIStore();
  const [deleteFiles, setDeleteFiles] = useState(true);
  const open = deleteConfirmHashes.length > 0;

  // Reset to checked every time the modal opens
  useEffect(() => {
    if (open) setDeleteFiles(true);
  }, [open]);
  const deleteTorrent = useDeleteTorrent();
  const batchDelete = useBatchDelete();
  const isBulk = deleteConfirmHashes.length > 1;

  const handleDelete = () => {
    if (isBulk) {
      batchDelete.mutate({ hashes: deleteConfirmHashes, deleteFiles });
      deselectAllTorrents();
    } else {
      deleteTorrent.mutate({ hash: deleteConfirmHashes[0], deleteFiles });
      setSelectedTorrent(null);
    }
    setDeleteFiles(false);
    clearDeleteConfirm();
  };

  const handleCancel = () => {
    setDeleteFiles(false);
    clearDeleteConfirm();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCancel} />
          <motion.div
            className="relative glass rounded-2xl p-6 w-full max-w-sm shadow-2xl shadow-black/40"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <h3 className="text-base font-semibold mb-2">
              {isBulk ? `Delete ${deleteConfirmHashes.length} torrents?` : 'Delete torrent?'}
            </h3>
            <p className="text-sm text-white/50 mb-4">
              {isBulk
                ? 'This will remove the selected torrents from the client.'
                : 'This will remove the torrent from the client.'}
            </p>

            <label className="flex items-center gap-2.5 mb-5 cursor-pointer group">
              <input
                type="checkbox"
                checked={deleteFiles}
                onChange={(e) => setDeleteFiles(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/[0.06] accent-red-500"
              />
              <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
                Also delete files from disk
              </span>
            </label>

            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg bg-white/[0.06] text-sm hover:bg-white/[0.1] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
