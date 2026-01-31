import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../stores/uiStore.js';
import { useUpdateTorrent } from '../../hooks/useTorrents.js';
import { api } from '../../services/api.js';
import { GlowBadge } from '../ui/GlowBadge.js';
import { GradientProgress } from '../ui/GradientProgress.js';
import { formatBytes, formatSpeed, formatPercent, formatDate, formatETA } from '../../lib/formatters.js';
import { FileBrowser } from './FileBrowser.js';
import { PeerList } from './PeerList.js';
import type { TMDBDetails } from '../../types/index.js';

const TMDB_IMG = 'https://image.tmdb.org/t/p';
const DETAIL_POLL_INTERVAL_MS = 1000;
const TMDB_STALE_TIME_MS = 5 * 60 * 1000;
const SWIPE_DISMISS_THRESHOLD_PX = 100;
const MAX_VISIBLE_CAST = 20;
const MAX_VISIBLE_GENRES = 3;

type Tab = 'overview' | 'files' | 'peers' | 'trackers';

function TmdbHero({ tmdb, tmdbTitle, tmdbYear, hasTmdbId }: {
  tmdb: TMDBDetails | undefined;
  tmdbTitle: string | undefined;
  tmdbYear: string | undefined;
  hasTmdbId: boolean;
}) {
  if (tmdb?.backdrop_path) {
    return (
      <div className="h-40 max-md:h-48 relative overflow-hidden flex-shrink-0">
        <img
          src={`${TMDB_IMG}/w780${tmdb.backdrop_path}`}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-base" />
        <div className="absolute bottom-3 left-4 right-4 flex items-end gap-3">
          {tmdb.poster_path && (
            <img
              src={`${TMDB_IMG}/w154${tmdb.poster_path}`}
              alt=""
              className="w-16 h-24 rounded-lg object-cover shadow-lg flex-shrink-0"
            />
          )}
          <div className="min-w-0">
            {tmdbTitle && (
              <h2 className="text-sm font-bold leading-tight text-white drop-shadow-lg">
                {tmdbTitle} {tmdbYear && <span className="text-white/60">({tmdbYear})</span>}
              </h2>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {tmdb.vote_average > 0 && (
                <span className="text-xs font-medium text-yellow-400">
                  ★ {tmdb.vote_average.toFixed(1)}
                </span>
              )}
              {tmdb.runtime && (
                <span className="text-xs text-white/50">{tmdb.runtime}m</span>
              )}
              {tmdb.genres?.slice(0, MAX_VISIBLE_GENRES).map(g => (
                <span key={g.id} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/60">
                  {g.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (hasTmdbId) {
    return (
      <div className="h-32 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-base" />
      </div>
    );
  }

  return null;
}

function DetailHeader({ torrent, onClose }: {
  torrent: any;
  onClose: () => void;
}) {
  return (
    <div className="p-4 border-b border-white/[0.06]">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h2 className="text-sm font-semibold leading-tight">{torrent.name}</h2>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white/80 text-lg leading-none flex-shrink-0"
        >
          &times;
        </button>
      </div>
      <GlowBadge status={torrent.status} />
      <GradientProgress progress={torrent.progress} className="mt-3" />
      <div className="mt-2 text-xs text-white/40 font-mono">
        {formatPercent(torrent.progress)} — {formatBytes(torrent.downloaded)} / {formatBytes(torrent.totalSize)}
      </div>
    </div>
  );
}

function DetailActions({ torrent, onDelete }: {
  torrent: any;
  onDelete: () => void;
}) {
  const updateTorrent = useUpdateTorrent();

  return (
    <div className="px-4 py-2 flex gap-2 border-b border-white/[0.06]">
      {torrent.status === 'downloading' || torrent.status === 'seeding' ? (
        <button
          onClick={() => updateTorrent.mutate({ hash: torrent.infoHash, data: { status: 'paused' } })}
          className="px-3 py-1 rounded-lg bg-white/[0.06] text-xs hover:bg-white/[0.1] transition-colors"
        >
          Pause
        </button>
      ) : torrent.status === 'paused' ? (
        <button
          onClick={() => updateTorrent.mutate({ hash: torrent.infoHash, data: { status: 'downloading' } })}
          className="px-3 py-1 rounded-lg bg-white/[0.06] text-xs hover:bg-white/[0.1] transition-colors"
        >
          Resume
        </button>
      ) : null}
      <button
        onClick={onDelete}
        className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-colors"
      >
        Remove
      </button>
    </div>
  );
}

function DetailTabs({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const tabs: Tab[] = ['overview', 'files', 'peers', 'trackers'];

  return (
    <div className="flex border-b border-white/[0.06]">
      {tabs.map(t => (
        <button
          key={t}
          onClick={() => setTab(t)}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            tab === t ? 'text-white border-b border-accent-indigo' : 'text-white/40 hover:text-white/60'
          }`}
        >
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </button>
      ))}
    </div>
  );
}

function OverviewTab({ torrent, tmdb }: { torrent: any; tmdb: TMDBDetails | undefined }) {
  return (
    <div className="space-y-4">
      {tmdb?.overview && (
        <div>
          <h4 className="text-xs font-medium text-white/60 mb-1">Synopsis</h4>
          <p className="text-xs text-white/50 leading-relaxed">{tmdb.overview}</p>
        </div>
      )}

      {tmdb?.credits?.cast && tmdb.credits.cast.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-white/60 mb-2">Cast</h4>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {tmdb.credits.cast.slice(0, MAX_VISIBLE_CAST).map(member => (
              <div key={member.id} className="flex-shrink-0 w-14 text-center">
                {member.profile_path ? (
                  <img
                    src={`${TMDB_IMG}/w185${member.profile_path}`}
                    alt={member.name}
                    className="w-14 h-14 rounded-full object-cover bg-white/5"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-white/20 text-sm">
                    ?
                  </div>
                )}
                <p className="text-[10px] text-white/70 mt-1 truncate">{member.name}</p>
                <p className="text-[9px] text-white/30 truncate">{member.character}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 text-xs">
        <Row label="Status" value={torrent.status} />
        <Row label="Download Speed" value={formatSpeed(torrent.downloadSpeed)} />
        <Row label="Upload Speed" value={formatSpeed(torrent.uploadSpeed)} />
        <Row label="Peers" value={String(torrent.numPeers)} />
        <Row label="ETA" value={formatETA(torrent.timeRemaining || Infinity)} />
        <Row label="Downloaded" value={formatBytes(torrent.downloaded)} />
        <Row label="Uploaded" value={formatBytes(torrent.uploaded)} />
        <Row label="Total Size" value={formatBytes(torrent.totalSize)} />
        <Row label="Added" value={formatDate(torrent.addedAt)} />
        {torrent.completedAt && <Row label="Completed" value={formatDate(torrent.completedAt)} />}
        <Row label="Info Hash" value={torrent.infoHash} mono />
        <Row label="Save Path" value={torrent.savePath} mono />
      </div>
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

  const tmdbTitle = tmdb?.title || tmdb?.name;
  const tmdbYear = tmdb?.release_date?.slice(0, 4) || tmdb?.first_air_date?.slice(0, 4);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current !== null) {
      const diff = e.changedTouches[0].clientY - touchStartY.current;
      if (diff > SWIPE_DISMISS_THRESHOLD_PX) setSelectedTorrent(null);
      touchStartY.current = null;
    }
  };

  return (
    <AnimatePresence>
      {selectedTorrent && torrent && (
        <motion.div
          className="w-96 max-md:fixed max-md:inset-0 max-md:w-full max-md:z-40 glass border-l border-white/[0.06] max-md:border-l-0 flex flex-col h-full overflow-hidden"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <TmdbHero tmdb={tmdb} tmdbTitle={tmdbTitle} tmdbYear={tmdbYear} hasTmdbId={!!torrent.tmdbId} />
          <DetailHeader torrent={torrent} onClose={() => setSelectedTorrent(null)} />
          <DetailActions torrent={torrent} onDelete={() => setDeleteConfirmHashes([torrent.infoHash])} />
          <DetailTabs tab={tab} setTab={setTab} />

          <div className="flex-1 overflow-auto p-4">
            {tab === 'overview' && <OverviewTab torrent={torrent} tmdb={tmdb} />}
            {tab === 'files' && <FileBrowser hash={torrent.infoHash} />}
            {tab === 'peers' && <PeerList hash={torrent.infoHash} />}
            {tab === 'trackers' && (
              <div className="text-xs text-white/40">Tracker info shown when available</div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-white/40">{label}</span>
      <span className={`text-right truncate ${mono ? 'font-mono text-white/60' : 'text-white/80'}`}>{value}</span>
    </div>
  );
}
