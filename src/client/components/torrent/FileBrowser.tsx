import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api.js';
import { formatBytes } from '../../lib/formatters.js';

const FILES_POLL_INTERVAL_MS = 5000;

interface Props {
  hash: string;
}

export function FileBrowser({ hash }: Props) {
  const { data: files, isLoading } = useQuery({
    queryKey: ['torrent-files', hash],
    queryFn: () => api.getTorrentFiles(hash),
    refetchInterval: FILES_POLL_INTERVAL_MS,
  });

  if (isLoading) return <div className="text-xs text-white/40">Loading files...</div>;
  if (!files?.length) return <div className="text-xs text-white/40">No files</div>;

  return (
    <div className="space-y-1">
      {files.map((f: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs p-1.5 rounded hover:bg-white/[0.03]">
          <span className="text-white/50">📄</span>
          <span className="flex-1 truncate text-white/90">{f.name}</span>
          <span className="text-white/50 font-mono flex-shrink-0">{formatBytes(f.length)}</span>
          <a
            href={`/api/files/stream/${hash}/${f.index}`}
            target="_blank"
            rel="noopener"
            className="text-accent-indigo hover:text-accent-purple text-xs flex-shrink-0"
          >
            ▶
          </a>
        </div>
      ))}
    </div>
  );
}
