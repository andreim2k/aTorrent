import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api.js';
import { formatBytes } from '../../lib/formatters.js';

const FILES_POLL_INTERVAL_MS = 5000;

export function FileBrowser({ hash }: { hash: string }) {
  const { data: files, isLoading } = useQuery({
    queryKey: ['torrent-files', hash],
    queryFn: () => api.getTorrentFiles(hash),
    refetchInterval: FILES_POLL_INTERVAL_MS,
  });

  if (isLoading) return <p className="holo-label">Reading payload…</p>;
  if (!files?.length) return <p className="holo-label">No files</p>;

  return (
    <div>
      {files.map((file: any, index: number) => (
        <div key={index} className="holo-file">
          <span className="holo-file__name" title={file.name}>{file.name}</span>
          <span className="holo-file__size">{formatBytes(file.length)}</span>
          <a
            className="holo-file__play"
            href={`/api/files/stream/${hash}/${file.index}`}
            target="_blank"
            rel="noopener"
            aria-label={`Stream ${file.name}`}
          >
            ▶
          </a>
        </div>
      ))}
    </div>
  );
}
