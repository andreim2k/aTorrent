import { useState } from 'react';
import { GlassModal } from '../ui/GlassModal.js';
import { DropZone } from '../ui/DropZone.js';
import { useUIStore } from '../../stores/uiStore.js';
import { useAddTorrent } from '../../hooks/useTorrents.js';
import { api } from '../../services/api.js';

export function AddTorrentModal() {
  const { showAddModal, setShowAddModal } = useUIStore();
  const [magnet, setMagnet] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const addTorrent = useAddTorrent();

  const close = () => {
    setError('');
    setShowAddModal(false);
  };

  const handleMagnetSubmit = async () => {
    if (!magnet.trim()) return;
    setLoading(true);
    setError('');
    try {
      await addTorrent.mutateAsync(magnet.trim());
      setMagnet('');
      setShowAddModal(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileDrop = async (files: File[]) => {
    if (files.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.addTorrentFiles(files);
      // Server returns either a single result or { ok, results } for multi-file uploads.
      const hadError = Array.isArray((data as any)?.results)
        ? (data as any).results.some((r: any) => r?.error)
        : (data as any)?.error;
      if (hadError) {
        setError(typeof hadError === 'string' ? hadError : 'One or more torrents failed to add');
      } else {
        setShowAddModal(false);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassModal open={showAddModal} onClose={close} index="ADD" title="Add Transfer">
      <div className="holo-field" style={{ marginBottom: 20 }}>
        <span className="holo-field__label holo-label">Magnet link</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            value={magnet}
            onChange={(event) => setMagnet(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleMagnetSubmit()}
            placeholder="magnet:?xt=urn:btih:…"
            className="holo-input holo-input--mono"
            aria-label="Magnet link"
          />
          <button
            className="holo-btn holo-btn--primary"
            onClick={handleMagnetSubmit}
            disabled={loading || !magnet.trim()}
          >
            {loading ? '…' : 'Add'}
          </button>
        </div>
      </div>

      <div className="holo-or holo-label" style={{ marginBottom: 20 }}>or</div>

      <DropZone onFileDrop={handleFileDrop} disabled={loading} />

      {error && <p className="holo-note holo-note--error" style={{ marginTop: 16 }}>{error}</p>}
    </GlassModal>
  );
}
