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
const TABS: Tab[] = ['overview', 'files', 'peers', 'trackers'];

function Hero({ tmdb, title, year }: { tmdb: TMDBDetails | undefined; title?: string; year?: string }) {
  if (!tmdb?.backdrop_path) return null;

  return (
    <div className="holo-detail__hero">
      <img className="backdrop" src={`${TMDB_IMG}/w780${tmdb.backdrop_path}`} alt="" />
      <div className="holo-detail__hero-body">
        {tmdb.poster_path && (
          <img className="holo-detail__poster" src={`${TMDB_IMG}/w154${tmdb.poster_path}`} alt="" />
        )}
        <div style={{ minWidth: 0 }}>
          {title && (
            <h3 style={{ fontSize: '.875rem', lineHeight: 1.3 }}>
              {title} {year && <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>({year})</span>}
            </h3>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 7 }}>
            {tmdb.vote_average > 0 && (
              <span className="holo-num" style={{ color: 'var(--warn)', fontSize: '.6875rem' }}>
                ★ {tmdb.vote_average.toFixed(1)}
              </span>
            )}
            {tmdb.runtime && <span className="holo-label">{tmdb.runtime}m</span>}
            {tmdb.genres?.slice(0, MAX_VISIBLE_GENRES).map((genre) => (
              <span key={genre.id} className="holo-chip">{genre.name}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="holo-dl__row">
      <dt>{label}</dt>
      <dd className={mono ? 'mono' : undefined}>{value}</dd>
    </div>
  );
}

function OverviewTab({ torrent, tmdb }: { torrent: any; tmdb: TMDBDetails | undefined }) {
  return (
    <>
      {tmdb?.overview && (
        <div className="holo-section">
          <p className="holo-section__title holo-label">Synopsis</p>
          <p style={{ color: 'var(--text-2)', fontSize: '.75rem', lineHeight: 1.65 }}>{tmdb.overview}</p>
        </div>
      )}

      {tmdb?.credits?.cast && tmdb.credits.cast.length > 0 && (
        <div className="holo-section">
          <p className="holo-section__title holo-label">Cast</p>
          <div className="holo-cast">
            {tmdb.credits.cast.slice(0, MAX_VISIBLE_CAST).map((member) => (
              <div key={member.id} className="holo-cast__item">
                {member.profile_path ? (
                  <img className="holo-cast__face" src={`${TMDB_IMG}/w185${member.profile_path}`} alt={member.name} />
                ) : (
                  <div className="holo-cast__face" style={{ display: 'grid', placeItems: 'center', color: 'var(--text-4)' }}>?</div>
                )}
                <p style={{ fontSize: '.625rem', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {member.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="holo-section">
        <p className="holo-section__title holo-label">Telemetry</p>
        <dl className="holo-dl">
          <Row label="Status" value={torrent.status} />
          <Row label="Downlink" value={formatSpeed(torrent.downloadSpeed)} />
          <Row label="Uplink" value={formatSpeed(torrent.uploadSpeed)} />
          <Row label="Peers" value={String(torrent.numPeers)} />
          <Row label="ETA" value={formatETA(torrent.timeRemaining || Infinity)} />
          <Row label="Downloaded" value={formatBytes(torrent.downloaded)} />
          <Row label="Uploaded" value={formatBytes(torrent.uploaded)} />
          <Row label="Total size" value={formatBytes(torrent.totalSize)} />
          <Row label="Added" value={formatDate(torrent.addedAt)} />
          {torrent.completedAt && <Row label="Completed" value={formatDate(torrent.completedAt)} />}
          <Row label="Info hash" value={torrent.infoHash} mono />
          <Row label="Save path" value={torrent.savePath} mono />
        </dl>
      </div>
    </>
  );
}

export function TorrentDetail() {
  const { selectedTorrent, setSelectedTorrent, setDeleteConfirmHashes } = useUIStore();
  const [tab, setTab] = useState<Tab>('overview');
  const touchStartY = useRef<number | null>(null);
  const updateTorrent = useUpdateTorrent();

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

  const title = tmdb?.title || tmdb?.name;
  const year = tmdb?.release_date?.slice(0, 4) || tmdb?.first_air_date?.slice(0, 4);

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartY.current = event.touches[0].clientY;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartY.current !== null) {
      const diff = event.changedTouches[0].clientY - touchStartY.current;
      if (diff > SWIPE_DISMISS_THRESHOLD_PX) setSelectedTorrent(null);
      touchStartY.current = null;
    }
  };

  const isRunning = torrent?.status === 'downloading' || torrent?.status === 'seeding';

  return (
    <AnimatePresence>
      {selectedTorrent && torrent && (
        <motion.aside
          className="holo-detail"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <Hero tmdb={tmdb} title={title} year={year} />

          <div className="holo-detail__head">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
              <h2 className="holo-detail__title">{torrent.name}</h2>
              <button className="holo-icon-btn" onClick={() => setSelectedTorrent(null)} aria-label="Close details">×</button>
            </div>

            <GlowBadge status={torrent.status} />

            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="holo-row__pct">{formatPercent(torrent.progress)}</span>
                <span className="holo-label">
                  {formatBytes(torrent.downloaded)} / {formatBytes(torrent.totalSize)}
                </span>
              </div>
              <GradientProgress progress={torrent.progress} />
            </div>
          </div>

          <div className="holo-detail__acts">
            {(isRunning || torrent.status === 'paused') && (
              <button
                className="holo-btn"
                onClick={() => updateTorrent.mutate({
                  hash: torrent.infoHash,
                  data: { status: isRunning ? 'paused' : 'downloading' },
                })}
              >
                {isRunning ? 'Pause' : 'Resume'}
              </button>
            )}
            <button className="holo-btn holo-btn--danger" onClick={() => setDeleteConfirmHashes([torrent.infoHash])}>
              Remove
            </button>
          </div>

          <div className="holo-tabs" role="tablist">
            {TABS.map((item) => (
              <button
                key={item}
                role="tab"
                aria-selected={tab === item}
                className={`holo-tab ${tab === item ? 'is-active' : ''}`}
                onClick={() => setTab(item)}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>

          <div className="holo-detail__body">
            {tab === 'overview' && <OverviewTab torrent={torrent} tmdb={tmdb} />}
            {tab === 'files' && <FileBrowser hash={torrent.infoHash} />}
            {tab === 'peers' && <PeerList hash={torrent.infoHash} />}
            {tab === 'trackers' && <p className="holo-label">Tracker data appears when reported</p>}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
