import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api.js';
import { useUIStore } from '../../stores/uiStore.js';
import { useAddTorrent } from '../../hooks/useTorrents.js';
import { toast } from '../../stores/toastStore.js';
import { Icon } from './Icon.js';

/** Window-wide drop target for .torrent files, plus paste-a-magnet-anywhere. */
export function GlobalDrop() {
  const qc = useQueryClient();
  const addMagnet = useAddTorrent();
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);

  useEffect(() => {
    const hasFiles = (e: DragEvent) => !!e.dataTransfer?.types?.includes('Files');
    const modalOpen = () => useUIStore.getState().showAddModal;

    const enter = (e: DragEvent) => {
      if (!hasFiles(e) || modalOpen()) return;
      depth.current++;
      setDragging(true);
    };
    const over = (e: DragEvent) => { if (hasFiles(e)) e.preventDefault(); };
    const leave = () => {
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setDragging(false);
    };
    const drop = async (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current = 0;
      setDragging(false);
      if (modalOpen()) return;
      const files = Array.from(e.dataTransfer?.files ?? []).filter((f) => f.name.toLowerCase().endsWith('.torrent'));
      if (!files.length) { toast.error('Not a .torrent file'); return; }
      try {
        await Promise.all(files.map((f) => api.addTorrentFile(f)));
        toast.success(`Added ${files.length} torrent${files.length === 1 ? '' : 's'}`, 'Fetching metadata…');
        qc.refetchQueries({ queryKey: ['torrents'] });
      } catch (err: any) {
        toast.error('Could not add torrent', err.message);
      }
    };
    const paste = (e: ClipboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const text = e.clipboardData?.getData('text')?.trim();
      if (text?.startsWith('magnet:?')) addMagnet.mutate(text);
    };

    window.addEventListener('dragenter', enter);
    window.addEventListener('dragover', over);
    window.addEventListener('dragleave', leave);
    window.addEventListener('drop', drop);
    window.addEventListener('paste', paste);
    return () => {
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragover', over);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('drop', drop);
      window.removeEventListener('paste', paste);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qc]);

  return (
    <AnimatePresence>
      {dragging && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-base/80 backdrop-blur-md pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="m-8 w-full max-w-xl aspect-[16/9] rounded-3xl border-2 border-dashed border-accent-indigo/60 bg-accent-indigo/[0.07] flex flex-col items-center justify-center gap-4 shadow-glow-indigo"
            initial={{ scale: 0.92 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
          >
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 via-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-glow-indigo">
              <Icon name="download" size={30} strokeWidth={2.4} />
            </motion.div>
            <div className="text-center">
              <div className="text-xl font-semibold tracking-tight">Drop to add</div>
              <div className="text-sm text-white/45 mt-1">Release your .torrent files anywhere</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
