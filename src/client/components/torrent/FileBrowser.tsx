import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api.js';
import { formatBytes } from '../../lib/formatters.js';
import { useUIStore } from '../../stores/uiStore.js';
import { Icon } from '../ui/Icon.js';

const FILES_POLL_INTERVAL_MS = 5000;
const VIDEO_EXTENSIONS = ['.mp4', '.m4v', '.mkv', '.webm', '.mov', '.avi', '.ts'];

function isVideoFile(name: string): boolean {
  const lower = name.toLowerCase();
  return VIDEO_EXTENSIONS.some(ext => lower.endsWith(ext));
}

interface Props {
  hash: string;
}

export function FileBrowser({ hash }: Props) {
  const setPreview = useUIStore((s) => s.setPreview);
  const { data: files, isLoading } = useQuery({
    queryKey: ['torrent-files', hash],
    queryFn: () => api.getTorrentFiles(hash),
    refetchInterval: FILES_POLL_INTERVAL_MS,
  });

  if (isLoading) {
    return <div className="space-y-2">{[0, 1, 2].map(i => <div key={i} className="h-11 rounded-xl skeleton" />)}</div>;
  }
  if (!files?.length) return <div className="text-sm text-white/35">No files yet. Waiting for metadata.</div>;

  return (
    <div className="space-y-1">
      <div className="text-[11px] text-white/30 mb-2 num">{files.length} file{files.length === 1 ? '' : 's'}</div>
      {files.map((f: any) => {
        const video = isVideoFile(f.name);
        const parts = f.name.split('/');
        const base = parts.pop() as string;
        const dir = parts.join('/');
        return (
          <div key={f.index} className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors">
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${video ? 'bg-accent-indigo/15 text-indigo-300' : 'bg-white/[0.05] text-white/40'}`}>
              <Icon name={video ? 'film' : 'file'} size={15} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-white/90 truncate" title={f.name}>{base}</div>
              {dir && <div className="text-[10px] text-white/25 truncate">{dir}</div>}
            </div>
            <span className="text-[11px] text-white/40 num flex-shrink-0">{formatBytes(f.length)}</span>
            <div className="flex gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 max-md:opacity-100 transition-opacity">
              {video && (
                <button onClick={() => setPreview(hash, f.index)} className="w-7 h-7 rounded-lg flex items-center justify-center text-indigo-300 hover:bg-indigo-400/15 transition-colors" title="Preview" aria-label={`Preview ${base}`}>
                  <Icon name="play" size={13} fill="currentColor" />
                </button>
              )}
              <a
                href={`/api/files/stream/${hash}/${f.index}`}
                download={base}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/45 hover:text-white hover:bg-white/[0.1] transition-colors"
                title="Download"
                aria-label={`Download ${base}`}
              >
                <Icon name="download" size={13} />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
