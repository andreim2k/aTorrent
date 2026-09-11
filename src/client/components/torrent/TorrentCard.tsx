import { GradientProgress } from '../ui/GradientProgress.js';
import { GlowBadge } from '../ui/GlowBadge.js';
import { formatBytes, formatSpeed, formatETA, formatPercent } from '../../lib/formatters.js';
import { useUIStore } from '../../stores/uiStore.js';
import { useUpdateTorrent } from '../../hooks/useTorrents.js';
import type { Torrent } from '../../types/index.js';

interface Props { torrent: Torrent; onSelect: (hash: string, shiftKey: boolean) => void; }

export function TorrentCard({ torrent, onSelect }: Props) {
  const { selectedTorrent, setSelectedTorrent, selectedTorrents, setDeleteConfirmHashes } = useUIStore();
  const updateTorrent = useUpdateTorrent();

  const isOpen = selectedTorrent === torrent.infoHash;
  const isChecked = selectedTorrents.has(torrent.infoHash);
  const isRunning = torrent.status === 'downloading' || torrent.status === 'seeding';

  const togglePlayback = (event: React.MouseEvent) => {
    event.stopPropagation();
    updateTorrent.mutate({ hash: torrent.infoHash, data: { status: isRunning ? 'paused' : 'downloading' } });
  };

  // Shift-click anywhere on the row extends the selection range instead of
  // opening the detail panel — the checkbox itself always does, plain click or not.
  const onOpen = (event: React.MouseEvent) => {
    if (event.shiftKey) { onSelect(torrent.infoHash, true); return; }
    setSelectedTorrent(isOpen ? null : torrent.infoHash);
  };

  // Fully controlled: handle the click directly rather than onChange, so a
  // shift-click can be routed to range selection instead of a native toggle.
  const onCheckboxClick = (event: React.MouseEvent<HTMLInputElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onSelect(torrent.infoHash, event.shiftKey);
  };

  return (
    <article
      className={`holo-row ${isOpen ? 'is-open' : ''} ${isChecked ? 'is-checked' : ''}`}
      onClick={onOpen}
      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedTorrent(isOpen ? null : torrent.infoHash); } }}
      tabIndex={0}
      role="button"
      aria-pressed={isOpen}
    >
      <div className="holo-row__ident">
        <input
          type="checkbox"
          className="holo-check"
          checked={isChecked}
          onClick={onCheckboxClick}
          onChange={() => {}}
          aria-label={`Select ${torrent.name}`}
        />
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
