import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../stores/uiStore.js';
import { useUpdateTorrent } from '../../hooks/useTorrents.js';
import { api } from '../../services/api.js';
import { GlowBadge } from '../ui/GlowBadge.js';
import { GradientProgress } from '../ui/GradientProgress.js';
import { Icon } from '../ui/Icon.js';
import { formatBytes, formatSpeed, formatPercent, formatDate, formatETA } from '../../lib/formatters.js';
import { parseRelease, chipTone } from '../../lib/release.js';
import { FileBrowser } from './FileBrowser.js';
import { hueFor } from './useTorrentActions.js';
import type { TMDBDetails } from '../../types/index.js';

const TMDB_IMG = 'https://image.tmdb.org/t/p';
const DETAIL_POLL_INTERVAL_MS = 1000;
const TMDB_STALE_TIME_MS = 5 * 60 * 1000;
const SWIPE_DISMISS_THRESHOLD_PX = 100;
const MAX_VISIBLE_CAST = 20;
const MAX_VISIBLE_GENRES = 3;

type Tab = 'overview' | 'files' | 'details';
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'files', label: 'Files' },
  { id: 'details', label: 'Details' },
];

function Hero({ torrent, tmdb, onClose }: { torrent: any; tmdb: TMDBDetails | undefined; onClose: () => void }) {
  const rel = parseRelease(torrent.name);
  const title = tmdb?.title || tmdb?.name || rel.title;
  const year = tmdb?.release_date?.slice(0, 4) || tmdb?.first_air_date?.slice(0, 4) || rel.year;
  const hue = hueFor(torrent.infoHash);
  const poster = tmdb?.poster_path || torrent.posterPath;

  return (
    <div className="relative flex-shrink-0">
      <div className="h-44 max-md:h-52 relative overflow-hidden">
        {tmdb?.backdrop_path ? (
          <motion.img
            initial={{ scale: 1.12, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            src={`${TMDB_IMG}/w780${tmdb.backdrop_path}`}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full" style={{ background: `radial-gradient(120% 140% at 20% 0%, hsl(${hue} 60% 35%), hsl(${(hue + 70) % 360} 55% 12%) 70%)` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-base-50 via-base-50/50 to-black/30" />
      </div>

      <button
        onClick={onClose}
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition-all"
        aria-label="Close details"
      >
        <Icon name="x" size={15} />
      </button>

      <div className="absolute left-5 right-5 -bottom-10 flex items-end gap-4">
        <div className="w-[92px] h-[136px] rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-white/20 shadow-2xl shadow-black/70 bg-base-100">
          {poster ? (
            <img src={`${TMDB_IMG}/w342${poster}`} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40" style={{ background: `linear-gradient(150deg, hsl(${hue} 55% 32%), hsl(${(hue + 50) % 360} 60% 14%))` }}>
              <Icon name="film" size={28} />
            </div>
          )}
        </div>
        <div className="min-w-0 pb-1.5">
          <h2 className="text-lg font-semibold leading-tight tracking-tight line-clamp-2">
            {title} {year && <span className="text-white/40 font-normal">{year}</span>}
          </h2>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs">
            {tmdb && tmdb.vote_average > 0 && (
              <span className="flex items-center gap-1 text-amber-300 font-medium"><Icon name="star" size={12} fill="currentColor" strokeWidth={1} />{tmdb.vote_average.toFixed(1)}</span>
            )}
            {tmdb?.runtime ? <span className="text-white/45">{Math.floor(tmdb.runtime / 60)}h {tmdb.runtime % 60}m</span> : null}
            {tmdb?.number_of_seasons ? <span className="text-white/45">{tmdb.number_of_seasons} season{tmdb.number_of_seasons > 1 ? 's' : ''}</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, tint }: { icon: 'arrowDown' | 'arrowUp' | 'users' | 'zap'; label: string; value: string; tint: string }) {
  return (
    <div className="panel px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-white/35">
        <span style={{ color: tint }}><Icon name={icon} size={11} strokeWidth={2.6} /></span>
        {label}
      </div>
      <div className="mt-1 text-[15px] font-semibold num tracking-tight">{value}</div>
    </div>
  );
}

function Actions({ torrent, onDelete }: { torrent: any; onDelete: () => void }) {
  const updateTorrent = useUpdateTorrent();
  const setPreview = useUIStore((s) => s.setPreview);
  const pausable = torrent.status === 'downloading' || torrent.status === 'seeding';
  const resumable = torrent.status === 'paused';

  return (
    <div className="flex gap-2">
      <button onClick={() => setPreview(torrent.infoHash)} className="btn-primary flex-1 h-10 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
        <Icon name="play" size={14} fill="currentColor" /> Watch
      </button>
      {(pausable || resumable) && (
        <button
          onClick={() => updateTorrent.mutate({ hash: torrent.infoHash, data: { status: pausable ? 'paused' : 'downloading' } })}
          className="btn-ghost h-10 px-4 rounded-xl text-sm font-medium flex items-center gap-2"
        >
          <Icon name={pausable ? 'pause' : 'play'} size={14} fill={pausable ? 'none' : 'currentColor'} />
          {pausable ? 'Pause' : 'Resume'}
        </button>
      )}
      <button onClick={onDelete} className="h-10 w-10 rounded-xl flex items-center justify-center bg-rose-500/10 border border-rose-400/15 text-rose-300 hover:bg-rose-500/20 transition-colors" title="Remove" aria-label="Remove torrent">
        <Icon name="trash" size={15} />
      </button>
    </div>
  );
}

function Overview({ tmdb }: { tmdb: TMDBDetails | undefined }) {
  if (!tmdb) {
    return <p className="text-sm text-white/35">No metadata yet. This torrent has not been matched with TMDB.</p>;
  }
  return (
    <div className="space-y-5">
      {tmdb.genres?.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {tmdb.genres.slice(0, MAX_VISIBLE_GENRES + 2).map((g) => (
            <span key={g.id} className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-white/70">{g.name}</span>
          ))}
        </div>
      )}
      {tmdb.overview && <p className="text-[13px] text-white/60 leading-relaxed">{tmdb.overview}</p>}

      {tmdb.credits?.cast && tmdb.credits.cast.length > 0 && (
        <div>
          <h4 className="text-[11px] uppercase tracking-[0.12em] text-white/35 mb-3">Cast</h4>
          <div className="flex gap-3.5 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
            {tmdb.credits.cast.slice(0, MAX_VISIBLE_CAST).map((m) => (
              <div key={m.id} className="flex-shrink-0 w-16 text-center">
                {m.profile_path ? (
                  <img src={`${TMDB_IMG}/w185${m.profile_path}`} alt={m.name} loading="lazy" className="w-16 h-16 rounded-full object-cover bg-white/5 ring-1 ring-white/10" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20">?</div>
                )}
                <p className="text-[11px] text-white/80 mt-1.5 truncate">{m.name}</p>
                <p className="text-[10px] text-white/30 truncate">{m.character}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Details({ torrent }: { torrent: any }) {
  const rows: [string, string, boolean?][] = [
    ['Status', torrent.status],
    ['Total size', formatBytes(torrent.totalSize)],
    ['Downloaded', formatBytes(torrent.downloaded)],
    ['Uploaded', formatBytes(torrent.uploaded)],
    ['Added', formatDate(torrent.addedAt)],
    ...(torrent.completedAt ? [['Completed', formatDate(torrent.completedAt)] as [string, string]] : []),
    ['Info hash', torrent.infoHash, true],
    ['Save path', torrent.savePath, true],
  ];
  return (
    <div className="panel divide-y divide-white/[0.05]">
      {rows.map(([k, v, mono]) => (
        <div key={k} className="flex justify-between gap-6 px-3.5 py-2.5 text-xs">
          <span className="text-white/40 flex-shrink-0">{k}</span>
          <span className={`text-right break-all ${mono ? 'font-mono text-[11px] text-white/55' : 'text-white/85 capitalize'}`}>{v}</span>
        </div>
      ))}
    </div>
  );
}

export function TorrentDetail() {
  const { selectedTorrent, setSelectedTorrent, setDeleteConfirmHashes } = useUIStore();
  const [tab, setTab] = useState<Tab>('overview');
  const touchStartY = useRef<number | null>(null);

  const { data: torrent } = useQuery({
    queryKey: ['torrent', selectedTorrent],
    queryFn: () => api.getTorrent(selectedTorrent!),
    enabled: !!selectedTorrent,
    refetchInterval: DETAIL_POLL_INTERVAL_MS,
  });

  const { data: tmdb } = useQuery<TMDBDetails>({
    queryKey: ['torrent-tmdb', selectedTorrent],
    queryFn: () => api.getTorrentTMDB(selectedTorrent!),
    enabled: !!selectedTorrent && !!torrent?.tmdbId,
    staleTime: TMDB_STALE_TIME_MS,
  });

  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current !== null) {
      if (e.changedTouches[0].clientY - touchStartY.current > SWIPE_DISMISS_THRESHOLD_PX) setSelectedTorrent(null);
      touchStartY.current = null;
    }
  };

  const rel = torrent ? parseRelease(torrent.name) : null;
  const mobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Esc closes the panel unless something modal is on top of it
  useEffect(() => {
    if (!selectedTorrent) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const s = useUIStore.getState();
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (s.showAddModal || s.showSettingsModal || s.showPalette || s.deleteConfirmHashes.length || s.previewHash || s.selectionMode) return;
      s.setSelectedTorrent(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedTorrent]);

  return (
    <AnimatePresence>
      {selectedTorrent && torrent && (
        <motion.aside
          key="detail"
          className="flex-shrink-0 max-md:fixed max-md:inset-0 max-md:z-40 glass bg-base-50/85 rounded-2xl max-md:rounded-none h-full overflow-hidden shadow-float"
          initial={mobile ? { y: '100%' } : { width: 0, opacity: 0, marginLeft: -16 }}
          animate={mobile ? { y: 0 } : { width: 420, opacity: 1, marginLeft: 0 }}
          exit={mobile ? { y: '100%' } : { width: 0, opacity: 0, marginLeft: -16 }}
          transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-[420px] max-md:w-full h-full overflow-y-auto">
            <Hero torrent={torrent} tmdb={tmdb} onClose={() => setSelectedTorrent(null)} />

            <div className="px-5 pt-14 pb-5 space-y-4">
              <div className="flex items-center gap-1.5 flex-wrap">
                <GlowBadge status={torrent.status} />
                {rel?.episode && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md border bg-pink-400/10 text-pink-300 border-pink-400/20">{rel.episode}</span>}
                {rel?.chips.map((c) => (
                  <span key={c.label} className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${chipTone[c.tone]}`}>{c.label}</span>
                ))}
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-2xl font-semibold num tracking-tight">{formatPercent(torrent.progress)}</span>
                  <span className="text-xs text-white/40 num">{formatBytes(torrent.downloaded)} of {formatBytes(torrent.totalSize)}</span>
                </div>
                <GradientProgress progress={torrent.progress} status={torrent.status} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Stat icon="arrowDown" label="Download" value={formatSpeed(torrent.downloadSpeed)} tint="#38bdf8" />
                <Stat icon="arrowUp" label="Upload" value={formatSpeed(torrent.uploadSpeed)} tint="#a78bfa" />
                <Stat icon="zap" label="ETA" value={torrent.progress >= 1 ? 'Done' : formatETA(torrent.timeRemaining || Infinity)} tint="#fbbf24" />
                <Stat icon="users" label="Peers" value={String(torrent.numPeers)} tint="#34d399" />
              </div>

              <Actions torrent={torrent} onDelete={() => setDeleteConfirmHashes([torrent.infoHash])} />
            </div>

            {/* Tabs */}
            <div className="sticky top-0 z-10 px-5 bg-base-50/90 backdrop-blur-xl border-y border-white/[0.06]">
              <div className="flex gap-1" role="tablist">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={tab === t.id}
                    onClick={() => setTab(t.id)}
                    className={`relative px-3.5 py-3 text-xs font-medium transition-colors ${tab === t.id ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                  >
                    {t.label}
                    {tab === t.id && (
                      <motion.div layoutId="detail-tab" className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-accent-cyan to-accent-purple" transition={{ type: 'spring', damping: 30, stiffness: 400 }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
                  {tab === 'overview' && <Overview tmdb={tmdb} />}
                  {tab === 'files' && <FileBrowser hash={torrent.infoHash} />}
                  {tab === 'details' && <Details torrent={torrent} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
