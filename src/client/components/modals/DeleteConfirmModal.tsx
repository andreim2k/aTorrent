import { useState, useEffect } from 'react';
import { GlassModal } from '../ui/GlassModal.js';
import { useUIStore } from '../../stores/uiStore.js';
import { useDeleteTorrent, useBatchDelete } from '../../hooks/useTorrents.js';

export function DeleteConfirmModal() {
  const { deleteConfirmHashes, clearDeleteConfirm, setSelectedTorrent, exitSelectionMode } = useUIStore();
  const [deleteFiles, setDeleteFiles] = useState(true);
  const open = deleteConfirmHashes.length > 0;
  const isBulk = deleteConfirmHashes.length > 1;

  const deleteTorrent = useDeleteTorrent();
  const batchDelete = useBatchDelete();

  // Reset to checked every time the modal opens.
  useEffect(() => {
    if (open) setDeleteFiles(true);
  }, [open]);

  const handleDelete = () => {
    if (isBulk) {
      batchDelete.mutate({ hashes: deleteConfirmHashes, deleteFiles });
      exitSelectionMode();
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
    <GlassModal
      open={open}
      onClose={handleCancel}
      index="WRN"
      title={isBulk ? `Remove ${deleteConfirmHashes.length} transfers` : 'Remove transfer'}
      footer={
        <>
          <button className="holo-btn holo-btn--ghost" onClick={handleCancel}>Cancel</button>
          <button className="holo-btn holo-btn--danger" onClick={handleDelete}>Remove</button>
        </>
      }
    >
      <p style={{ color: 'var(--text-2)', marginBottom: 18 }}>
        {isBulk
          ? 'The selected transfers will be removed from the console.'
          : 'This transfer will be removed from the console.'}
      </p>

      <label className="holo-toggle" style={{ margin: 0 }}>
        <span>
          <span style={{ display: 'block', fontSize: '.8125rem' }}>Delete files from disk</span>
          <span className="holo-label">Payload data is permanently erased</span>
        </span>
        <input
          type="checkbox"
          className="holo-check"
          checked={deleteFiles}
          onChange={(event) => setDeleteFiles(event.target.checked)}
        />
      </label>
    </GlassModal>
  );
}
