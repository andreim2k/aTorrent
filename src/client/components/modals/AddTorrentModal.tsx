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
    setLoading(true);
    setError('');
    try {
      await Promise.all(files.map(file => api.addTorrentFile(file)));
      setShowAddModal(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassModal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Torrent">
      <div className="space-y-4">
        {/* Magnet link */}
        <div>
          <label className="text-xs text-white/40 mb-1 block">Magnet Link</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={magnet}
              onChange={(e) => setMagnet(e.target.value)}
              placeholder="magnet:?xt=urn:btih:..."
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm
                placeholder:text-white/20 focus:outline-none focus:border-accent-indigo/40 transition-colors font-mono"
              onKeyDown={(e) => e.key === 'Enter' && handleMagnetSubmit()}
            />
            <button
              onClick={handleMagnetSubmit}
              disabled={loading || !magnet.trim()}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent-indigo to-accent-purple
                text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              {loading ? '...' : 'Add'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-white/20">
          <div className="flex-1 h-px bg-white/[0.08]" />
          <span>or</span>
          <div className="flex-1 h-px bg-white/[0.08]" />
        </div>

        {/* File upload */}
        <DropZone onFileDrop={handleFileDrop} />

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>
    </GlassModal>
  );
}
