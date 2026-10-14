import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../stores/uiStore.js';
import { api } from '../../services/api.js';
import { formatBytes, formatPercent } from '../../lib/formatters.js';
import type { TorrentFile } from '../../types/index.js';

const VIDEO_EXTENSIONS = ['.mp4', '.m4v', '.mkv', '.webm', '.mov', '.avi', '.ts'];

function isVideoFile(name: string): boolean {
  const lower = name.toLowerCase();
  return VIDEO_EXTENSIONS.some(ext => lower.endsWith(ext));
}

export function VideoPreviewModal() {
  const { previewHash, previewFileIndex, closePreview } = useUIStore();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [playbackError, setPlaybackError] = useState(false);

  const { data: files, isLoading } = useQuery<TorrentFile[]>({
    queryKey: ['torrent-files', previewHash],
    queryFn: () => api.getTorrentFiles(previewHash!),
    enabled: !!previewHash,
  });

  const videoFiles = useMemo(
    () => (files ?? []).filter(f => isVideoFile(f.name)),
    [files]
  );

  // Pick the requested file, or default to the largest video file
  useEffect(() => {
    if (!previewHash) {
      setActiveIndex(null);
      return;
    }
    if (previewFileIndex !== null) {
      setActiveIndex(previewFileIndex);
    } else if (videoFiles.length > 0) {
      const largest = videoFiles.reduce((a, b) => (b.length > a.length ? b : a));
      setActiveIndex(largest.index);
    }
  }, [previewHash, previewFileIndex, videoFiles]);

  useEffect(() => {
    setPlaybackError(false);
  }, [activeIndex, previewHash]);

  // Close on Escape
  useEffect(() => {
    if (!previewHash) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePreview();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewHash, closePreview]);

  const activeFile = files?.find(f => f.index === activeIndex);
  const streamUrl = previewHash !== null && activeIndex !== null
    ? `/api/files/stream/${previewHash}/${activeIndex}`
    : null;

  return (
    <AnimatePresence>
      {previewHash && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePreview}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 max-md:p-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass bg-base-50/90 shadow-float rounded-2xl max-md:rounded-none w-full max-w-4xl overflow-hidden pointer-events-auto flex flex-col max-h-full"
              initial={{ scale: 0.97, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.97, y: 16 }}
            >
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.06]">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold truncate">
                    {activeFile?.name ?? 'Preview'}
                  </h2>
                  {activeFile && (
                    <p className="text-[10px] text-white/40 font-mono">
                      {formatBytes(activeFile.length)}
                      {activeFile.downloaded < activeFile.length &&
                        ` — ${formatPercent(activeFile.downloaded / activeFile.length)} downloaded, streaming as it arrives`}
                    </p>
                  )}
                </div>
                <button
                  onClick={closePreview}
                  className="text-white/40 hover:text-white/80 transition-colors text-xl leading-none flex-shrink-0"
                >
                  &times;
                </button>
              </div>

              <div className="bg-black flex-1 min-h-0 flex items-center justify-center">
                {isLoading ? (
                  <p className="text-xs text-white/40 py-24">Loading files...</p>
                ) : !streamUrl ? (
                  <p className="text-xs text-white/40 py-24">No video files in this torrent</p>
                ) : playbackError ? (
                  <div className="text-center py-24 px-6">
                    <p className="text-sm text-white/70 mb-2">This format can't be played in the browser</p>
                    <p className="text-xs text-white/40 mb-4">
                      Codecs like HEVC/x265 or containers like AVI often aren't supported. You can still download the file.
                    </p>
                    <a
                      href={streamUrl}
                      download={activeFile?.name}
                      className="inline-block px-4 py-1.5 rounded-lg bg-white/[0.08] text-xs hover:bg-white/[0.14] transition-colors"
                    >
                      Download file
                    </a>
                  </div>
                ) : (
                  <video
                    key={streamUrl}
                    src={streamUrl}
                    controls
                    autoPlay
                    className="w-full max-h-[70vh] max-md:max-h-full outline-none"
                    onError={() => setPlaybackError(true)}
                  />
                )}
              </div>

              {videoFiles.length > 1 && (
                <div className="px-4 py-2 border-t border-white/[0.06] flex gap-2 overflow-x-auto scrollbar-hide">
                  {videoFiles.map(f => (
                    <button
                      key={f.index}
                      onClick={() => setActiveIndex(f.index)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-colors ${
                        f.index === activeIndex
                          ? 'bg-accent-indigo/20 text-white'
                          : 'bg-white/[0.05] text-white/50 hover:bg-white/[0.1] hover:text-white/80'
                      }`}
                    >
                      {f.name.split('/').pop()}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
