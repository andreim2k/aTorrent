import { GlassCard } from '../ui/GlassCard.js';
import { GradientProgress } from '../ui/GradientProgress.js';
import { GlowBadge } from '../ui/GlowBadge.js';
import { formatBytes, formatSpeed, formatETA, formatPercent } from '../../lib/formatters.js';
import { useUIStore } from '../../stores/uiStore.js';
import { useUpdateTorrent } from '../../hooks/useTorrents.js';
import type { Torrent } from '../../types/index.js';

interface Props {
  torrent: Torrent;
}

const TMDB_IMG = 'https://image.tmdb.org/t/p/w92';

export function TorrentCard({ torrent }: Props) {
  const { selectedTorrent, setSelectedTorrent, selectionMode, selectedTorrents, toggleTorrentSelection, setDeleteConfirmHashes } = useUIStore();
  const updateTorrent = useUpdateTorrent();
  const isSelected = selectedTorrent === torrent.infoHash;
  const isChecked = selectedTorrents.has(torrent.infoHash);

  const handleClick = () => {
    if (selectionMode) {
      toggleTorrentSelection(torrent.infoHash);
    } else {
      setSelectedTorrent(isSelected ? null : torrent.infoHash);
    }
  };

  const handlePauseResume = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (torrent.status === 'downloading' || torrent.status === 'seeding') {
      updateTorrent.mutate({ hash: torrent.infoHash, data: { status: 'paused' } });
    } else if (torrent.status === 'paused') {
      updateTorrent.mutate({ hash: torrent.infoHash, data: { status: 'downloading' } });
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmHashes([torrent.infoHash]);
  };

  const showPause = torrent.status === 'downloading' || torrent.status === 'seeding';
  const showResume = torrent.status === 'paused';

  return (
    <GlassCard
      hover
      className={`p-3 relative group ${isSelected ? 'glass-active border-accent-indigo/30' : ''} ${isChecked ? 'ring-1 ring-accent-indigo/40' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Selection checkbox */}
        {selectionMode && (
          <div className="flex items-center pt-1 flex-shrink-0">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => toggleTorrentSelection(torrent.infoHash)}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded border-white/20 bg-white/[0.06] accent-indigo-500"
            />
          </div>
        )}

        {/* Poster thumbnail */}
        {torrent.posterPath ? (
          <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0 bg-white/5">
            <img
              src={`${TMDB_IMG}${torrent.posterPath}`}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        ) : (
          <div className="w-10 h-14 rounded bg-white/5 flex items-center justify-center text-white/20 text-lg flex-shrink-0">
            ◇
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-medium truncate">{torrent.name}</h3>
            <GlowBadge status={torrent.status} />
          </div>

          <GradientProgress progress={torrent.progress} className="mb-2" />

          <div className="flex items-center gap-4 text-xs text-white/40 font-mono max-md:gap-2 max-md:flex-wrap">
            <span>{formatPercent(torrent.progress)}</span>
            <span>{formatBytes(torrent.downloaded)} / {formatBytes(torrent.totalSize)}</span>
            {torrent.status === 'downloading' && (
              <>
                <span className="text-blue-400">↓ {formatSpeed(torrent.downloadSpeed)}</span>
                <span className="text-purple-400">↑ {formatSpeed(torrent.uploadSpeed)}</span>
                <span className="max-md:hidden">ETA {formatETA(torrent.timeRemaining || Infinity)}</span>
              </>
            )}
            {torrent.status === 'seeding' && (
              <span className="text-green-400">↑ {formatSpeed(torrent.uploadSpeed)}</span>
            )}
            <span>{torrent.numPeers} peer{torrent.numPeers !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Action buttons - visible on hover (desktop) or always (mobile) */}
        {!selectionMode && (showPause || showResume) && (
          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 max-md:opacity-100 transition-opacity">
            <button
              onClick={handlePauseResume}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.06] text-white/50 hover:text-white/90 hover:bg-white/[0.1] transition-all"
              title={showPause ? 'Pause' : 'Resume'}
            >
              {showPause ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>
            <button
              onClick={handleRemove}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400/60 hover:text-red-400 hover:bg-red-500/20 transition-all"
              title="Remove"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
