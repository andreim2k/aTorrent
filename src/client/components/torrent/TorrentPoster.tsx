import { motion, AnimatePresence } from 'framer-motion';
import { SelectCheckbox } from '../ui/SelectCheckbox.js';
import { ProgressRing } from '../ui/ProgressRing.js';
import { GradientProgress } from '../ui/GradientProgress.js';
import { GlowBadge } from '../ui/GlowBadge.js';
import { Icon } from '../ui/Icon.js';
import { formatBytes, formatSpeed, formatPercent } from '../../lib/formatters.js';
import { parseRelease } from '../../lib/release.js';
import { getStatus } from '../../lib/status.js';
import { useUIStore } from '../../stores/uiStore.js';
import { useTorrentActions, TMDB_IMG, hueFor } from './useTorrentActions.js';
import type { Torrent } from '../../types/index.js';

function FloatButton({ onClick, title, danger, children }: { onClick: (e: React.MouseEvent) => void; title: string; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border transition-all active:scale-90 ${
        danger
          ? 'bg-rose-500/25 border-rose-400/30 text-rose-200 hover:bg-rose-500/45'
          : 'bg-black/40 border-white/15 text-white hover:bg-white/25'
      }`}
    >
      {children}
    </button>
  );
}

export function TorrentPoster({ torrent }: { torrent: Torrent }) {
  const { selectedTorrent, setSelectedTorrent, selectionMode, selectedTorrents, toggleTorrentSelection, selectRange } = useUIStore();
  const actions = useTorrentActions(torrent);
  const isOpen = selectedTorrent === torrent.infoHash;
  const isChecked = selectedTorrents.has(torrent.infoHash);
  const rel = parseRelease(torrent.name);
  const status = getStatus(torrent.status);
  const hue = hueFor(torrent.infoHash);
  const done = torrent.progress >= 1;

  const handleClick = (e?: React.MouseEvent) => {
    if (selectionMode) {
      if (e?.shiftKey) selectRange(useUIStore.getState().visibleHashes, torrent.infoHash);
      else toggleTorrentSelection(torrent.infoHash);
    } else {
      setSelectedTorrent(isOpen ? null : torrent.infoHash);
    }
  };

  return (
    <motion.div
      onClick={handleClick}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', damping: 22, stiffness: 320 }}
      className={`group relative aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer bg-base-100 ring-1 ${
        isChecked ? 'ring-2 ring-accent-indigo shadow-glow-indigo' : isOpen ? 'ring-accent-indigo/60' : 'ring-white/10 hover:ring-white/25'
      } ${selectionMode && !isChecked ? 'opacity-75 hover:opacity-100' : ''} shadow-xl shadow-black/40`}
    >
      {torrent.posterPath ? (
        <img
          src={`${TMDB_IMG}/w342${torrent.posterPath}`}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center text-white/25"
          style={{ background: `linear-gradient(160deg, hsl(${hue} 55% 30%), hsl(${(hue + 60) % 360} 60% 12%))` }}
        >
          <Icon name="film" size={48} strokeWidth={1.4} />
        </div>
      )}

      {/* Legibility gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent via-45%" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent" />

      {/* Top row */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between">
        <AnimatePresence mode="wait" initial={false}>
          {selectionMode ? (
            <motion.div key="chk" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
              <SelectCheckbox checked={isChecked} onToggle={(e) => { e.stopPropagation(); handleClick(e); }} />
            </motion.div>
          ) : (
            <motion.div key="pill" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GlowBadge status={torrent.status} className="backdrop-blur-md !bg-black/45" />
            </motion.div>
          )}
        </AnimatePresence>

        {!done ? (
          <ProgressRing progress={torrent.progress} size={38} stroke={3} from={status.color} to="#818cf8" className="rounded-full bg-black/45 backdrop-blur-md">
            <span className="text-[9px] font-semibold num">{Math.floor(torrent.progress * 100)}</span>
          </ProgressRing>
        ) : (
          <div className="w-[30px] h-[30px] rounded-full bg-emerald-400/20 backdrop-blur-md border border-emerald-300/30 flex items-center justify-center text-emerald-300">
            <Icon name="check" size={14} strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Hover actions */}
      {!selectionMode && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 max-md:opacity-100 max-md:items-start max-md:justify-end max-md:pt-14 max-md:pr-2.5 max-md:flex-col max-md:gap-1.5 max-md:inset-auto max-md:right-0 max-md:top-0 transition-opacity duration-200">
          <FloatButton onClick={actions.preview} title="Preview"><Icon name="play" size={15} fill="currentColor" /></FloatButton>
          {(actions.canPause || actions.canResume) && (
            <FloatButton onClick={actions.togglePause} title={actions.canPause ? 'Pause' : 'Resume'}>
              <Icon name={actions.canPause ? 'pause' : 'play'} size={15} fill={actions.canPause ? 'none' : 'currentColor'} />
            </FloatButton>
          )}
          <FloatButton onClick={actions.remove} title="Remove" danger><Icon name="trash" size={15} /></FloatButton>
        </div>
      )}

      {/* Bottom info */}
      <div className="absolute inset-x-0 bottom-0 p-3.5">
        <h3 className="text-sm font-semibold leading-tight line-clamp-2 drop-shadow-lg" title={torrent.name}>{rel.title}</h3>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-white/55 num flex-wrap">
          {rel.year && <span>{rel.year}</span>}
          {rel.episode && <span className="text-pink-300 font-semibold">{rel.episode}</span>}
          {rel.chips[0] && <span className="px-1 rounded bg-white/15 text-white/80 text-[10px] font-medium">{rel.chips[0].label}</span>}
        </div>
        <GradientProgress progress={torrent.progress} status={torrent.status} className="mt-2.5" />
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-white/50 num">
          <span>{torrent.status === 'downloading' ? <span className="text-sky-300">{formatSpeed(torrent.downloadSpeed)}</span> : formatPercent(torrent.progress)}</span>
          <span>{formatBytes(torrent.totalSize)}</span>
        </div>
      </div>
    </motion.div>
  );
}
