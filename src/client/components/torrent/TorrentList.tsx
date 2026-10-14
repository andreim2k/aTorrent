import { AnimatePresence, motion } from 'framer-motion';
import { useVisibleTorrents } from '../../hooks/useTorrents.js';
import { useUIStore } from '../../stores/uiStore.js';
import { usePreferencesStore } from '../../stores/preferencesStore.js';
import { TorrentCard } from './TorrentCard.js';
import { TorrentPoster } from './TorrentPoster.js';
import { Icon } from '../ui/Icon.js';
import type { Torrent } from '../../types/index.js';

function Skeleton({ grid }: { grid: boolean }) {
  return grid ? (
    <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(168px,1fr))]">
      {Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-[2/3] rounded-2xl skeleton" />)}
    </div>
  ) : (
    <div className="space-y-2.5">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="glass rounded-xl p-3.5 flex gap-3.5">
          <div className="w-[52px] h-[76px] rounded-lg skeleton" />
          <div className="flex-1 space-y-3 pt-1">
            <div className="h-4 w-2/5 rounded skeleton" />
            <div className="h-3 w-1/4 rounded skeleton" />
            <div className="h-1.5 w-full rounded-full skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ filtered, searching }: { filtered: boolean; searching: boolean }) {
  const setShowAddModal = useUIStore((s) => s.setShowAddModal);
  const setFilterStatus = useUIStore((s) => s.setFilterStatus);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  return (
    <motion.div className="flex flex-col items-center text-center py-20 px-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="relative w-36 h-36 mb-6">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-400/25 via-indigo-500/25 to-fuchsia-500/25 blur-2xl" />
        <svg viewBox="0 0 144 144" className="relative w-full h-full" fill="none">
          <circle cx="72" cy="72" r="58" stroke="white" strokeOpacity="0.08" strokeDasharray="2 6" />
          <circle cx="72" cy="72" r="40" stroke="white" strokeOpacity="0.12" />
          <g className="origin-center animate-[spin_24s_linear_infinite]" style={{ transformOrigin: '72px 72px' }}>
            <circle cx="72" cy="14" r="5" fill="#38bdf8" />
            <circle cx="130" cy="72" r="3.5" fill="#a78bfa" />
          </g>
          <rect x="48" y="48" width="48" height="48" rx="14" fill="url(#eg)" />
          <path d="M72 58v20m0 0-8-8m8 8 8-8M62 88h20" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <defs>
            <linearGradient id="eg" x1="48" y1="48" x2="96" y2="96" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" /><stop offset="0.5" stopColor="#6366f1" /><stop offset="1" stopColor="#c026d3" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {searching ? (
        <>
          <h2 className="text-lg font-semibold">No matches</h2>
          <p className="text-sm text-white/40 mt-1.5 max-w-xs">Nothing in this view matches your search.</p>
          <button onClick={() => setSearchQuery('')} className="btn-ghost mt-5 px-4 h-9 rounded-xl text-sm">Clear search</button>
        </>
      ) : filtered ? (
        <>
          <h2 className="text-lg font-semibold">Nothing here</h2>
          <p className="text-sm text-white/40 mt-1.5 max-w-xs">No torrents in this view right now.</p>
          <button onClick={() => setFilterStatus('all')} className="btn-ghost mt-5 px-4 h-9 rounded-xl text-sm">Show whole library</button>
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold tracking-tight">Your library is empty</h2>
          <p className="text-sm text-white/40 mt-1.5 max-w-sm">
            Add a magnet link or drop a <span className="text-white/60">.torrent</span> file anywhere on this page. You can also just paste a magnet link.
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary mt-6 px-5 h-10 rounded-xl text-sm font-medium flex items-center gap-2">
            <Icon name="plus" size={15} strokeWidth={2.6} /> Add your first torrent
          </button>
        </>
      )}
    </motion.div>
  );
}

export function TorrentList() {
  const { torrents: filtered, isLoading } = useVisibleTorrents();
  const { filterStatus, searchQuery, selectionMode, setSelectionMode, selectedTorrents, selectAllTorrents, deselectAllTorrents } = useUIStore();
  const viewMode = usePreferencesStore((s) => s.viewMode);
  const grid = viewMode === 'grid';

  if (isLoading) return <Skeleton grid={grid} />;

  if (filtered.length === 0) {
    return <EmptyState filtered={filterStatus !== 'all'} searching={!!searchQuery} />;
  }

  const total = filtered.length;
  const allSelected = selectedTorrents.size === total;
  const groups: { label: string; test: (t: Torrent) => boolean; color: string }[] = [
    { label: 'Downloading', test: (t) => t.status === 'downloading', color: 'text-sky-300' },
    { label: 'Seeding', test: (t) => t.status === 'seeding', color: 'text-emerald-300' },
    { label: 'Paused', test: (t) => t.status === 'paused', color: 'text-amber-300' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 min-h-[34px]">
        <AnimatePresence mode="wait" initial={false}>
          {selectionMode ? (
            <motion.div
              key="sel"
              className="flex items-center gap-2 flex-wrap flex-1"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <button
                onClick={() => (allSelected ? setSelectionMode(true) : selectAllTorrents(filtered.map((t: Torrent) => t.infoHash)))}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-accent-indigo/30 to-accent-purple/30 border border-accent-indigo/30 text-xs font-medium hover:from-accent-indigo/50 hover:to-accent-purple/50 transition-all"
              >
                {allSelected ? 'Deselect all' : `Select all ${total}`}
              </button>
              {groups.map((g) => {
                const matches = filtered.filter(g.test);
                if (matches.length === 0) return null;
                return (
                  <button
                    key={g.label}
                    onClick={() => selectAllTorrents(matches.map((t: Torrent) => t.infoHash))}
                    className={`px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs transition-colors ${g.color}`}
                  >
                    {g.label} <span className="text-white/30 num">{matches.length}</span>
                  </button>
                );
              })}
              <span className="text-[11px] text-white/30 ml-1 max-md:hidden">Shift-click selects a range</span>
            </motion.div>
          ) : (
            <motion.div key="idle" className="flex-1 text-xs text-white/35 num" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {searchQuery ? `${total} result${total === 1 ? '' : 's'} for “${searchQuery}”` : `Showing ${total}`}
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => (selectionMode ? deselectAllTorrents() : setSelectionMode(true))}
          className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium transition-all ${
            selectionMode ? 'bg-white/[0.1] text-white hover:bg-white/[0.16]' : 'btn-ghost text-white/60 hover:text-white'
          }`}
        >
          <Icon name={selectionMode ? 'x' : 'select'} size={13} strokeWidth={2.4} />
          {selectionMode ? 'Cancel' : 'Select'}
        </button>
      </div>

      <div className={grid ? 'grid gap-4 grid-cols-[repeat(auto-fill,minmax(168px,1fr))] max-md:grid-cols-2' : 'space-y-2.5'}>
        <AnimatePresence mode="popLayout">
          {filtered.map((t: Torrent, i: number) => (
            <motion.div
              key={t.infoHash}
              layout
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 10) * 0.03 } }}
              exit={{ opacity: 0, scale: 0.94 }}
            >
              {grid ? <TorrentPoster torrent={t} /> : <TorrentCard torrent={t} />}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
