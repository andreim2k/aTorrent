import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { GlassModal } from '../ui/GlassModal.js';
import { DropZone } from '../ui/DropZone.js';
import { Icon } from '../ui/Icon.js';
import { useUIStore } from '../../stores/uiStore.js';
import { useAddTorrent } from '../../hooks/useTorrents.js';
import { toast } from '../../stores/toastStore.js';
import { api } from '../../services/api.js';

export function AddTorrentModal() {
  const { showAddModal, setShowAddModal } = useUIStore();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const addTorrent = useAddTorrent();
  const qc = useQueryClient();

  useEffect(() => {
    if (showAddModal) { setText(''); setError(''); }
  }, [showAddModal]);

  // One magnet per line
  const magnets = text.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('magnet:'));

  const handleSubmit = async () => {
    if (!magnets.length) return;
    setLoading(true);
    setError('');
    try {
      for (const m of magnets) await addTorrent.mutateAsync(m);
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
      await Promise.all(files.map((file) => api.addTorrentFile(file)));
      toast.success(`Added ${files.length} torrent${files.length === 1 ? '' : 's'}`, 'Fetching metadata…');
      qc.refetchQueries({ queryKey: ['torrents'] });
      setShowAddModal(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassModal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add torrents" subtitle="Paste magnet links or drop .torrent files">
      <div className="space-y-4">
        <div>
          <label htmlFor="magnets" className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-white/35 mb-2">
            <Icon name="link" size={12} /> Magnet links
          </label>
          <textarea
            id="magnets"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            autoFocus
            placeholder={'magnet:?xt=urn:btih:…\nOne link per line'}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-3 text-[13px] resize-none
              placeholder:text-white/20 focus:outline-none focus:border-accent-indigo/50 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.12)] transition-all font-mono"
            onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && handleSubmit()}
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-white/30 num">{magnets.length > 0 ? `${magnets.length} link${magnets.length === 1 ? '' : 's'} ready` : <span className="kbd">Ctrl</span>}{magnets.length === 0 && <span className="ml-1.5 text-white/30">+ <span className="kbd">Enter</span> to add</span>}</span>
            <button
              onClick={handleSubmit}
              disabled={loading || magnets.length === 0}
              className="btn-primary px-5 h-9 rounded-xl text-sm font-medium disabled:opacity-35 disabled:pointer-events-none"
            >
              {loading ? 'Adding…' : magnets.length > 1 ? `Add ${magnets.length}` : 'Add'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.12em] text-white/20">
          <div className="flex-1 h-px bg-white/[0.07]" />or<div className="flex-1 h-px bg-white/[0.07]" />
        </div>

        <DropZone onFileDrop={handleFileDrop} />

        {error && <p className="text-xs text-rose-300 bg-rose-400/10 border border-rose-400/20 rounded-lg px-3 py-2">{error}</p>}
      </div>
    </GlassModal>
  );
}
