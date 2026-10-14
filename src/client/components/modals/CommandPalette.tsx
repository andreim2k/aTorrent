import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../stores/uiStore.js';
import { usePreferencesStore } from '../../stores/preferencesStore.js';
import { useTorrents, useBatchPause, useBatchResume } from '../../hooks/useTorrents.js';
import { parseRelease } from '../../lib/release.js';
import { getStatus } from '../../lib/status.js';
import { Icon, type IconName } from '../ui/Icon.js';
import type { Torrent, FilterStatus } from '../../types/index.js';

interface Item {
  id: string;
  group: 'Actions' | 'View' | 'Go to' | 'Torrents';
  label: string;
  hint?: string;
  icon: IconName;
  tint?: string;
  run: () => void;
}

function score(query: string, text: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  const idx = t.indexOf(q);
  if (idx !== -1) return 100 - idx;
  // subsequence match
  let i = 0;
  for (const ch of t) if (ch === q[i]) i++;
  return i === q.length ? 10 : 0;
}

export function CommandPalette() {
  const ui = useUIStore();
  const prefs = usePreferencesStore();
  const { data: torrents } = useTorrents();
  const batchPause = useBatchPause();
  const batchResume = useBatchResume();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const open = ui.showPalette;

  // Global shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        useUIStore.getState().setShowPalette(!useUIStore.getState().showPalette);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const close = () => ui.setShowPalette(false);
    const list: Torrent[] = torrents || [];
    const all = list.map((t) => t.infoHash);
    const go = (label: string, status: FilterStatus, icon: IconName, tint: string): Item => ({
      id: `go-${status}`, group: 'Go to', label, icon, tint, run: () => { ui.setFilterStatus(status); close(); },
    });
    return [
      { id: 'add', group: 'Actions', label: 'Add torrent', hint: 'Magnet or .torrent', icon: 'plus', run: () => { close(); ui.setShowAddModal(true); } },
      { id: 'select', group: 'Actions', label: 'Select torrents', hint: 'Bulk mode', icon: 'select', run: () => { close(); ui.setSelectionMode(true); } },
      { id: 'pause-all', group: 'Actions', label: 'Pause all', icon: 'pause', run: () => { close(); if (all.length) batchPause.mutate(all); } },
      { id: 'resume-all', group: 'Actions', label: 'Resume all', icon: 'play', run: () => { close(); if (all.length) batchResume.mutate(all); } },
      { id: 'settings', group: 'Actions', label: 'Open settings', icon: 'sliders', run: () => { close(); ui.setShowSettingsModal(true); } },
      { id: 'view-list', group: 'View', label: 'List view', icon: 'list', run: () => { prefs.setViewMode('list'); close(); } },
      { id: 'view-grid', group: 'View', label: 'Poster grid view', icon: 'grid', run: () => { prefs.setViewMode('grid'); close(); } },
      { id: 'graph', group: 'View', label: prefs.showSpeedGraph ? 'Hide speed graph' : 'Show speed graph', icon: 'eye', run: () => { prefs.setShowSpeedGraph(!prefs.showSpeedGraph); close(); } },
      ...(['added', 'name', 'progress', 'size', 'speed'] as const).map((k): Item => ({
        id: `sort-${k}`, group: 'View', label: `Sort by ${k === 'added' ? 'date added' : k}`, icon: 'sort', run: () => { prefs.setSort(k); close(); },
      })),
      go('Library', 'all', 'layers', '#a5b4fc'),
      go('Downloading', 'downloading', 'download', '#38bdf8'),
      go('Seeding', 'seeding', 'upload', '#34d399'),
      go('Completed', 'completed', 'check', '#a3e635'),
      go('Paused', 'paused', 'pause', '#fbbf24'),
      go('Errors', 'error', 'alert', '#fb7185'),
      ...list.map((t): Item => {
        const rel = parseRelease(t.name);
        return {
          id: `t-${t.infoHash}`, group: 'Torrents', label: rel.title + (rel.year ? ` (${rel.year})` : ''),
          hint: getStatus(t.status).label, icon: 'film', tint: getStatus(t.status).color,
          run: () => { ui.setFilterStatus('all'); ui.setSelectedTorrent(t.infoHash); close(); },
        };
      }),
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [torrents, prefs.showSpeedGraph, open]);

  const results = useMemo(() => {
    return items
      .map((it) => ({ it, s: score(query, it.label + ' ' + it.group) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => (query ? b.s - a.s : 0))
      .map((r) => r.it);
  }, [items, query]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); results[active]?.run(); }
    else if (e.key === 'Escape') { ui.setShowPalette(false); }
  };

  let lastGroup = '';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => ui.setShowPalette(false)} />
          <div className="fixed inset-0 z-[61] flex items-start justify-center pt-[14vh] px-4 pointer-events-none">
            <motion.div
              role="dialog"
              aria-label="Command palette"
              className="glass bg-base-50/90 rounded-2xl w-full max-w-xl overflow-hidden shadow-float pointer-events-auto"
              initial={{ opacity: 0, y: -16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: 'spring', damping: 28, stiffness: 400 }}
            >
              <div className="flex items-center gap-3 px-4 border-b border-white/[0.07]">
                <Icon name="search" size={16} className="text-white/35" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Type a command or search torrents…"
                  className="flex-1 h-14 bg-transparent text-[15px] placeholder:text-white/25 focus:outline-none"
                  aria-label="Command palette search"
                />
                <span className="kbd">esc</span>
              </div>

              <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
                {results.length === 0 && <div className="py-10 text-center text-sm text-white/30">No results</div>}
                {results.map((it, idx) => {
                  const header = it.group !== lastGroup;
                  lastGroup = it.group;
                  return (
                    <div key={it.id}>
                      {header && <div className="px-3 pt-3 pb-1.5 text-[10px] uppercase tracking-[0.14em] text-white/25">{it.group}</div>}
                      <button
                        data-idx={idx}
                        onMouseMove={() => setActive(idx)}
                        onClick={it.run}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-colors ${active === idx ? 'bg-white/[0.08] text-white' : 'text-white/65'}`}
                      >
                        <span className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0" style={{ color: it.tint }}>
                          <Icon name={it.icon} size={14} />
                        </span>
                        <span className="flex-1 truncate">{it.label}</span>
                        {it.hint && <span className="text-xs text-white/30">{it.hint}</span>}
                        {active === idx && <span className="kbd">↵</span>}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 px-4 py-2.5 border-t border-white/[0.06] text-[11px] text-white/30">
                <span className="flex items-center gap-1.5"><span className="kbd">↑</span><span className="kbd">↓</span> navigate</span>
                <span className="flex items-center gap-1.5"><span className="kbd">↵</span> run</span>
                <span className="ml-auto">{results.length} result{results.length === 1 ? '' : 's'}</span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
