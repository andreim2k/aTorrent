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

  const isOpen = selectedTorrent === torrent.infoHash;
  const isChecked = selectedTorrents.has(torrent.infoHash);
  const isRunning = torrent.status === 'downloading' || torrent.status === 'seeding';

  const togglePlayback = (event: React.MouseEvent) => {
    event.stopPropagation();
    updateTorrent.mutate({ hash: torrent.infoHash, data: { status: isRunning ? 'paused' : 'downloading' } });
  };

  const onOpen = () => {
    if (selectionMode) toggleTorrentSelection(torrent.infoHash);
    else setSelectedTorrent(isOpen ? null : torrent.infoHash);
  };

  return (
    <article
      className={`holo-row ${isOpen ? 'is-open' : ''} ${isChecked ? 'is-checked' : ''}`}
      onClick={onOpen}
      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen(); } }}
      tabIndex={0}
      role="button"
      aria-pressed={isOpen}
    >
      <div className="holo-row__ident">
        {selectionMode ? (
          <input
            type="checkbox"
            className="holo-check"
            checked={isChecked}
            onChange={() => toggleTorrentSelection(torrent.infoHash)}
            onClick={(event) => event.stopPropagation()}
            aria-label={`Select ${torrent.name}`}
          />
        ) : (
          <span className="holo-row__index">{String(index).padStart(2, '0')}</span>
        )}
        <span className={`holo-led is-${torrent.status}`} aria-hidden="true" />
        <div style={{ minWidth: 0 }}>
          <h3 className="holo-row__name" title={torrent.name}>{torrent.name}</h3>
          <p className="holo-row__sub holo-label">
            <span>{formatBytes(torrent.totalSize)}</span>
            <span className="sep">·</span>
            <span>{torrent.numPeers} peers</span>
          </p>
        </div>
      </div>

      <div className="holo-row__progress">
        <div className="top">
          <span className="holo-row__pct">{formatPercent(torrent.progress)}</span>
          <span className="holo-label">
            {formatBytes(torrent.downloaded)} / {formatBytes(torrent.totalSize)}
          </span>
        </div>
        <GradientProgress progress={torrent.progress} />
      </div>

      <div className="holo-rate">
        {torrent.status === 'downloading' ? (
          <>
            <span className="down">↓ {formatSpeed(torrent.downloadSpeed)}</span>
            <span className="up">↑ {formatSpeed(torrent.uploadSpeed)}</span>
            <span className="eta">ETA {formatETA(torrent.timeRemaining || Infinity)}</span>
          </>
        ) : (
          <>
            <span className="up">↑ {formatSpeed(torrent.uploadSpeed)}</span>
            <span className="eta">{torrent.status === 'seeding' ? 'seeding' : 'idle'}</span>
          </>
        )}
      </div>

      <GlowBadge status={torrent.status} />

      <div className="holo-row__actions">
        {(isRunning || torrent.status === 'paused') && (
          <button
            className="holo-mini-btn"
            onClick={togglePlayback}
            title={isRunning ? 'Pause' : 'Resume'}
            aria-label={isRunning ? 'Pause transfer' : 'Resume transfer'}
          >
            {isRunning ? '‖' : '▶'}
          </button>
        )}
        <button
          className="holo-mini-btn is-danger"
          onClick={(event) => { event.stopPropagation(); setDeleteConfirmHashes([torrent.infoHash]); }}
          title="Remove"
          aria-label="Remove transfer"
        >
          ×
        </button>
      </div>
    </article>
  );
}
