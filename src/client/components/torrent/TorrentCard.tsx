import { GradientProgress } from '../ui/GradientProgress.js';
import { GlowBadge } from '../ui/GlowBadge.js';
import { formatBytes, formatSpeed, formatETA, formatPercent } from '../../lib/formatters.js';
import { useUIStore } from '../../stores/uiStore.js';
import { useUpdateTorrent } from '../../hooks/useTorrents.js';
import type { Torrent } from '../../types/index.js';

interface Props { torrent: Torrent; index: number; }

export function TorrentCard({ torrent, index }: Props) {
  const { selectedTorrent, setSelectedTorrent, selectionMode, selectedTorrents, toggleTorrentSelection, setDeleteConfirmHashes } = useUIStore();
  const updateTorrent = useUpdateTorrent();
  const isSelected = selectedTorrent === torrent.infoHash;
  const isChecked = selectedTorrents.has(torrent.infoHash);
  const isRunning = torrent.status === 'downloading' || torrent.status === 'seeding';

  const toggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    updateTorrent.mutate({ hash: torrent.infoHash, data: { status: isRunning ? 'paused' : 'downloading' } });
  };

  return (
    <article className={`torrent-row ${isSelected ? 'selected' : ''} ${isChecked ? 'checked' : ''}`} onClick={() => selectionMode ? toggleTorrentSelection(torrent.infoHash) : setSelectedTorrent(isSelected ? null : torrent.infoHash)}>
      <div className="torrent-ident">
        {selectionMode ? <input type="checkbox" checked={isChecked} onChange={() => toggleTorrentSelection(torrent.infoHash)} onClick={(event) => event.stopPropagation()} /> : <span className="job-index">{String(index).padStart(2, '0')}</span>}
        <span className={`job-led status-${torrent.status}`} />
        <div><h3>{torrent.name}</h3><p><span>{formatBytes(torrent.totalSize)}</span><i>•</i><span>{torrent.numPeers} peers</span><i>•</i><code>{torrent.infoHash.slice(0, 8)}</code></p></div>
      </div>
      <div className="torrent-progress"><div><b>{formatPercent(torrent.progress)}</b><span>{formatBytes(torrent.downloaded)} / {formatBytes(torrent.totalSize)}</span></div><GradientProgress progress={torrent.progress} /></div>
      <div className="torrent-rate">
        {torrent.status === 'downloading' ? <><span className="rate-down">↓ {formatSpeed(torrent.downloadSpeed)}</span><span className="rate-up">↑ {formatSpeed(torrent.uploadSpeed)}</span><small>ETA {formatETA(torrent.timeRemaining || Infinity)}</small></> : <><span className="rate-up">↑ {formatSpeed(torrent.uploadSpeed)}</span><small>{torrent.status === 'seeding' ? 'UNLIMITED' : 'NO TRAFFIC'}</small></>}
      </div>
      <GlowBadge status={torrent.status} />
      <div className="torrent-actions">
        {(isRunning || torrent.status === 'paused') && <button onClick={toggle} title={isRunning ? 'Pause' : 'Resume'}>{isRunning ? 'Ⅱ' : '▶'}</button>}
        <button className="danger" onClick={(event) => { event.stopPropagation(); setDeleteConfirmHashes([torrent.infoHash]); }} title="Remove">×</button>
        <span>›</span>
      </div>
    </article>
  );
}
