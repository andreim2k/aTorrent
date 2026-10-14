import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard.js';
import { GradientProgress } from '../ui/GradientProgress.js';
import { GlowBadge } from '../ui/GlowBadge.js';
import { SelectCheckbox } from '../ui/SelectCheckbox.js';
import { Icon } from '../ui/Icon.js';
import { formatBytes, formatSpeed, formatETA, formatPercent } from '../../lib/formatters.js';
import { parseRelease, chipTone } from '../../lib/release.js';
import { getStatus } from '../../lib/status.js';
import { useUIStore } from '../../stores/uiStore.js';
import { useVisibleTorrents } from '../../hooks/useTorrents.js';
import { useTorrentActions, TMDB_IMG, hueFor } from './useTorrentActions.js';
import type { Torrent } from '../../types/index.js';

interface Props {
  torrent: Torrent;
}

function IconButton({ onClick, title, tone = 'neutral', children }: { onClick: (e: React.MouseEvent) => void; title: string; tone?: 'neutral' | 'danger'; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-90 ${
        tone === 'danger'
          ? 'text-rose-300/60 hover:text-rose-300 hover:bg-rose-400/15'
          : 'text-white/50 hover:text-white hover:bg-white/[0.1]'
      }`}
    >
      {children}
    </button>
  );
}

export function TorrentCard({ torrent }: Props) {
  const { selectedTorrent, setSelectedTorrent, selectionMode, selectedTorrents, toggleTorrentSelection, selectRange } = useUIStore();
  const { torrents: visible } = useVisibleTorrents();
  const actions = useTorrentActions(torrent);
  const isOpen = selectedTorrent === torrent.infoHash;
  const isChecked = selectedTorrents.has(torrent.infoHash);
  const status = getStatus(torrent.status);
  const rel = parseRelease(torrent.name);
  const done = torrent.progress >= 1;

  const handleClick = (e?: React.MouseEvent) => {
    if (selectionMode) {
      if (e?.shiftKey) selectRange(visible.map((t) => t.infoHash), torrent.infoHash);
      else toggleTorrentSelection(torrent.infoHash);
    } else {
      setSelectedTorrent(isOpen ? null : torrent.infoHash);
    }
  };

  const hue = hueFor(torrent.infoHash);

  return (
    <GlassCard
      hover
      className={`relative group overflow-hidden p-3.5 max-md:p-3 ${isOpen ? 'glass-active' : ''} ${
        isChecked ? 'ring-1 ring-accent-indigo/60 bg-accent-indigo/[0.07] shadow-[0_0_28px_-6px_rgba(99,102,241,0.55)]' : ''
      } ${selectionMode && !isChecked ? 'opacity-70 hover:opacity-100' : ''}`}
      onClick={handleClick}
    >
      {/* Soft status wash for active transfers */}
      {torrent.status === 'downloading' && (
        <div className="absolute inset-0 bg-gradient-to-r from-sky-400/[0.06] via-transparent to-transparent pointer-events-none" />
      )}

      {/* Selected accent bar */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-accent-indigo via-accent-purple to-accent-pink"
        initial={false}
        animate={{ scaleY: isChecked || isOpen ? 1 : 0, opacity: isChecked || isOpen ? 1 : 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      />

      <div className="relative flex items-center gap-3.5">
        <AnimatePresence initial={false}>
          {selectionMode && (
            <motion.div
              className="flex items-center self-center flex-shrink-0 overflow-hidden"
              initial={{ width: 0, opacity: 0, x: -10 }}
              animate={{ width: 20, opacity: 1, x: 0 }}
              exit={{ width: 0, opacity: 0, x: -10 }}
              transition={{ type: 'spring', damping: 24, stiffness: 320 }}
            >
              <SelectCheckbox checked={isChecked} onToggle={(e) => { e.stopPropagation(); handleClick(e); }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Poster */}
        <div className="w-[52px] h-[76px] max-md:w-11 max-md:h-16 rounded-lg overflow-hidden flex-shrink-0 relative shadow-lg shadow-black/50 ring-1 ring-white/10">
          {torrent.posterPath ? (
            <img
              src={`${TMDB_IMG}/w185${torrent.posterPath}`}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white/50"
              style={{ background: `linear-gradient(145deg, hsl(${hue} 55% 32%), hsl(${(hue + 50) % 360} 60% 14%))` }}
            >
              <Icon name="film" size={20} />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-[15px] font-medium leading-snug truncate" title={torrent.name}>
                <span className="md:hidden inline-block w-2 h-2 rounded-full mr-2 align-middle" style={{ background: status.color, boxShadow: `0 0 8px ${status.color}` }} />
                {rel.title}
                {rel.year && <span className="ml-2 text-white/35 font-normal">{rel.year}</span>}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {rel.episode && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md border bg-pink-400/10 text-pink-300 border-pink-400/20">{rel.episode}</span>
                )}
                {rel.chips.slice(0, 4).map((c) => (
                  <span key={c.label} className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${chipTone[c.tone]}`}>{c.label}</span>
                ))}
              </div>
            </div>
            <GlowBadge status={torrent.status} className="flex-shrink-0 max-md:hidden" />
          </div>

          <GradientProgress progress={torrent.progress} status={torrent.status} className="mt-2.5" />

          <div className="mt-2 flex items-center gap-x-4 gap-y-1 text-[11.5px] text-white/40 num flex-wrap">
            <span className="text-white/80 font-medium">{formatPercent(torrent.progress)}</span>
            <span>{done ? formatBytes(torrent.totalSize) : `${formatBytes(torrent.downloaded)} / ${formatBytes(torrent.totalSize)}`}</span>
            {torrent.status === 'downloading' && (
              <>
                <span className="text-sky-300 flex items-center gap-1"><Icon name="arrowDown" size={11} strokeWidth={2.6} />{formatSpeed(torrent.downloadSpeed)}</span>
                <span className="text-violet-300 flex items-center gap-1 max-md:hidden"><Icon name="arrowUp" size={11} strokeWidth={2.6} />{formatSpeed(torrent.uploadSpeed)}</span>
                <span className="max-md:hidden">ETA {formatETA(torrent.timeRemaining || Infinity)}</span>
              </>
            )}
            {torrent.status === 'seeding' && (
              <span className="text-emerald-300 flex items-center gap-1"><Icon name="arrowUp" size={11} strokeWidth={2.6} />{formatSpeed(torrent.uploadSpeed)}</span>
            )}
            <span className="flex items-center gap-1 ml-auto max-md:ml-0"><Icon name="users" size={11} />{torrent.numPeers}</span>
          </div>
        </div>

        {/* Hover actions */}
        {!selectionMode && (
          <div className="flex flex-col gap-0.5 flex-shrink-0 opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 max-md:opacity-100 max-md:translate-x-0 transition-all duration-200">
            <div className="flex gap-0.5">
              <IconButton onClick={actions.preview} title="Preview"><Icon name="play" size={14} fill="currentColor" /></IconButton>
              {(actions.canPause || actions.canResume) && (
                <IconButton onClick={actions.togglePause} title={actions.canPause ? 'Pause' : 'Resume'}>
                  <Icon name={actions.canPause ? 'pause' : 'play'} size={14} fill={actions.canPause ? 'none' : 'currentColor'} />
                </IconButton>
              )}
              <IconButton onClick={actions.remove} title="Remove" tone="danger"><Icon name="trash" size={14} /></IconButton>
            </div>
          </div>
        )}
      </div>
      <span className="sr-only">{status.label}</span>
    </GlassCard>
  );
}
