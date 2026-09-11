import { create } from 'zustand';
import type { FilterStatus } from '../types/index.js';

/** Matches the width at which the rail stops being a column and becomes an
 *  overlay drawer (see the 900px block in globals.css). Below it the rail must
 *  start closed, or first paint is the menu covering the transfer queue. */
const RAIL_OVERLAY_QUERY = '(max-width: 900px)';

function railStartsCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(RAIL_OVERLAY_QUERY).matches;
}

interface UIState {
  selectedTorrent: string | null;
  showAddModal: boolean;
  showSettingsModal: boolean;
  filterStatus: FilterStatus;
  filterCategory: number | null;
  searchQuery: string;
  sidebarCollapsed: boolean;

  // Delete confirmation
  deleteConfirmHashes: string[];
  setDeleteConfirmHashes: (hashes: string[]) => void;
  clearDeleteConfirm: () => void;

  // Bulk selection — checkboxes are always on screen, so there is no separate
  // "selection mode" to enter; the bulk dock simply appears once the set is non-empty.
  selectedTorrents: Set<string>;
  /** Anchor for shift-click range selection; the last hash explicitly toggled or ranged to. */
  lastSelectedHash: string | null;
  toggleTorrentSelection: (hash: string) => void;
  /** Extend the selection from the last anchor to `hash` across `visibleHashes` (shift-click). */
  selectRange: (visibleHashes: string[], hash: string) => void;
  selectAllTorrents: (hashes: string[]) => void;
  clearSelection: () => void;

  setSelectedTorrent: (hash: string | null) => void;
  setShowAddModal: (show: boolean) => void;
  setShowSettingsModal: (show: boolean) => void;
  setFilterStatus: (status: FilterStatus) => void;
  setFilterCategory: (id: number | null) => void;
  setSearchQuery: (q: string) => void;
  toggleSidebar: () => void;
  /** Close the rail only where it overlays content; a no-op on desktop. */
  dismissRailIfOverlay: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedTorrent: null,
  showAddModal: false,
  showSettingsModal: false,
  filterStatus: 'all',
  filterCategory: null,
  searchQuery: '',
  sidebarCollapsed: railStartsCollapsed(),

  // Delete confirmation
  deleteConfirmHashes: [],
  setDeleteConfirmHashes: (hashes) => set({ deleteConfirmHashes: hashes }),
  clearDeleteConfirm: () => set({ deleteConfirmHashes: [] }),

  // Bulk selection
  selectedTorrents: new Set<string>(),
  lastSelectedHash: null,
  toggleTorrentSelection: (hash) =>
    set((s) => {
      const next = new Set(s.selectedTorrents);
      if (next.has(hash)) next.delete(hash);
      else next.add(hash);
      return { selectedTorrents: next, lastSelectedHash: hash };
    }),
  selectRange: (visibleHashes, hash) =>
    set((s) => {
      const next = new Set(s.selectedTorrents);
      const anchor = s.lastSelectedHash;
      const from = anchor ? visibleHashes.indexOf(anchor) : -1;
      const to = visibleHashes.indexOf(hash);
      if (from === -1 || to === -1) {
        next.add(hash);
      } else {
        const [lo, hi] = from < to ? [from, to] : [to, from];
        for (let i = lo; i <= hi; i++) next.add(visibleHashes[i]);
      }
      return { selectedTorrents: next, lastSelectedHash: hash };
    }),
  selectAllTorrents: (hashes) => set({ selectedTorrents: new Set(hashes), lastSelectedHash: null }),
  clearSelection: () => set({ selectedTorrents: new Set(), lastSelectedHash: null }),

  setSelectedTorrent: (hash) => set({ selectedTorrent: hash }),
  setShowAddModal: (show) => set({ showAddModal: show }),
  setShowSettingsModal: (show) => set({ showSettingsModal: show }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setFilterCategory: (id) => set({ filterCategory: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  dismissRailIfOverlay: () => {
    if (railStartsCollapsed()) set({ sidebarCollapsed: true });
  },
}));
