import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../stores/uiStore.js';
import { usePreferencesStore, type SortKey } from '../../stores/preferencesStore.js';
import { useTorrents } from '../../hooks/useTorrents.js';
import { useAuth } from '../../hooks/useAuth.js';
import { Icon } from '../ui/Icon.js';

const titles: Record<string, string> = {
  all: 'Library',
  downloading: 'Downloading',
  seeding: 'Seeding',
  completed: 'Completed',
  paused: 'Paused',
  error: 'Errors',
};

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'added', label: 'Date added' },
  { key: 'name', label: 'Name' },
  { key: 'progress', label: 'Progress' },
  { key: 'size', label: 'Size' },
  { key: 'speed', label: 'Speed' },
];

function SortMenu() {
  const { sortKey, sortDir, setSort } = usePreferencesStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = sortOptions.find((o) => o.key === sortKey)!;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="btn-ghost h-9 px-3 rounded-xl flex items-center gap-2 text-xs text-white/70 hover:text-white"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Icon name="sort" size={14} />
        <span className="max-lg:hidden">{current.label}</span>
        <Icon name={sortDir === 'asc' ? 'arrowUp' : 'arrowDown'} size={12} className="text-white/40" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            className="absolute right-0 top-11 w-44 glass rounded-xl p-1.5 z-50 shadow-float bg-base-50/90"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.12 }}
          >
            {sortOptions.map((o) => (
              <button
                key={o.key}
                role="menuitem"
                onClick={() => { setSort(o.key); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                  sortKey === o.key ? 'bg-white/[0.08] text-white' : 'text-white/60 hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                {o.label}
                {sortKey === o.key && <Icon name={sortDir === 'asc' ? 'arrowUp' : 'arrowDown'} size={12} className="text-accent-indigo" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ViewToggle() {
  const { viewMode, setViewMode } = usePreferencesStore();
  return (
    <div className="relative flex p-0.5 rounded-xl bg-white/[0.05] border border-white/[0.07] max-md:hidden" role="group" aria-label="View mode">
      {(['list', 'grid'] as const).map((m) => (
        <button
          key={m}
          onClick={() => setViewMode(m)}
          aria-pressed={viewMode === m}
          title={m === 'list' ? 'List view' : 'Poster grid'}
          className={`relative w-8 h-8 flex items-center justify-center rounded-[10px] transition-colors ${viewMode === m ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
        >
          {viewMode === m && (
            <motion.div layoutId="view-pill" className="absolute inset-0 rounded-[10px] bg-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" transition={{ type: 'spring', damping: 28, stiffness: 400 }} />
          )}
          <Icon name={m} size={15} className="relative" />
        </button>
      ))}
    </div>
  );
}

export function TopBar() {
  const { searchQuery, setSearchQuery, setShowAddModal, setShowSettingsModal, toggleSidebar, filterStatus, setShowPalette } = useUIStore();
  const { data: torrents } = useTorrents();
  const { username, logout } = useAuth();
  const searchRef = useRef<HTMLInputElement>(null);

  // "/" focuses search from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const total = torrents?.length ?? 0;

  return (
    <header className="flex items-center gap-3 px-4 py-3.5 max-md:px-2 max-md:gap-2">
      <button
        onClick={toggleSidebar}
        className="w-9 h-9 flex items-center justify-center rounded-xl text-white/45 hover:text-white hover:bg-white/[0.07] transition-all"
        aria-label="Toggle sidebar"
      >
        <Icon name="sidebar" size={18} />
      </button>

      <div className="min-w-0 max-md:hidden">
        <h1 className="text-[22px] font-semibold tracking-tight leading-none">{titles[filterStatus]}</h1>
        <p className="text-[11px] text-white/35 mt-1 num">{total} torrent{total === 1 ? '' : 's'} in total</p>
      </div>

      <div className="flex-1 flex justify-center px-2 max-md:px-0">
        <div className="relative w-full max-w-md group">
          <Icon name="search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 group-focus-within:text-accent-indigo transition-colors" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && (setSearchQuery(''), searchRef.current?.blur())}
            placeholder="Search library"
            aria-label="Search torrents"
            className="w-full h-10 bg-white/[0.045] border border-white/[0.07] rounded-xl pl-10 pr-3 md:pr-12 text-sm
              placeholder:text-white/25 focus:outline-none focus:border-accent-indigo/50 focus:bg-white/[0.07]
              focus:shadow-[0_0_0_4px_rgba(99,102,241,0.12)] transition-all"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 kbd pointer-events-none max-md:hidden">/</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowPalette(true)}
          className="btn-ghost h-9 px-2.5 rounded-xl flex items-center gap-2 text-white/50 hover:text-white max-md:hidden"
          title="Command palette"
        >
          <Icon name="command" size={14} />
          <span className="kbd">K</span>
        </button>
        <ViewToggle />
        <SortMenu />
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary h-9 px-4 rounded-xl flex items-center gap-1.5 text-sm font-medium max-md:px-3"
        >
          <Icon name="plus" size={15} strokeWidth={2.6} />
          <span className="max-md:hidden">Add</span>
        </button>
        <button
          onClick={() => setShowSettingsModal(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-white/45 hover:text-white hover:bg-white/[0.07] transition-all"
          title="Settings"
          aria-label="Settings"
        >
          <Icon name="sliders" size={17} />
        </button>
        {username && username !== 'local' && (
          <button
            onClick={() => logout()}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-rose-300/70 hover:text-rose-300 hover:bg-rose-400/10 transition-all"
            title={`Sign out ${username}`}
            aria-label="Sign out"
          >
            <Icon name="logout" size={16} />
          </button>
        )}
      </div>
    </header>
  );
}
