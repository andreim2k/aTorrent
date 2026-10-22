import { create } from 'zustand';
import type { FilterStatus } from '../types/index.js';

interface UIState {
  selectedTorrent: string | null;
  showAddModal: boolean;
  showSettingsModal: boolean;
  filterStatus: FilterStatus;
  filterCategory: number | null;
  searchQuery: string;
  sidebarCollapsed: boolean;

  // Command palette
  showPalette: boolean;
  setShowPalette: (show: boolean) => void;

  // Delete confirmation
  deleteConfirmHashes: string[];
  setDeleteConfirmHashes: (hashes: string[]) => void;
  clearDeleteConfirm: () => void;

  // Video preview
  previewHash: string | null;
  previewFileIndex: number | null;
  setPreview: (hash: string, fileIndex?: number) => void;
  closePreview: () => void;

  // Bulk selection
  selectedTorrents: Set<string>;
  selectionMode: boolean;
  toggleTorrentSelection: (hash: string) => void;
  selectAllTorrents: (hashes: string[]) => void;
  deselectAllTorrents: () => void;
  lastSelectedTorrent: string | null;
  visibleHashes: string[];
  setVisibleHashes: (hashes: string[]) => void;
  selectRange: (hashes: string[], toHash: string) => void;
  setSelectionMode: (on: boolean) => void;

  setSelectedTorrent: (hash: string | null) => void;
  setShowAddModal: (show: boolean) => void;
  setShowSettingsModal: (show: boolean) => void;
  setFilterStatus: (status: FilterStatus) => void;
  setFilterCategory: (id: number | null) => void;
  setSearchQuery: (q: string) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedTorrent: null,
  showAddModal: false,
  showSettingsModal: false,
  filterStatus: 'all',
  filterCategory: null,
  searchQuery: '',
  sidebarCollapsed: typeof window !== 'undefined' && window.innerWidth < 768,

  // Command palette
  showPalette: false,
  setShowPalette: (show) => set({ showPalette: show }),

  // Delete confirmation
  deleteConfirmHashes: [],
  setDeleteConfirmHashes: (hashes) => set({ deleteConfirmHashes: hashes }),
  clearDeleteConfirm: () => set({ deleteConfirmHashes: [] }),

  // Video preview
  previewHash: null,
  previewFileIndex: null,
  setPreview: (hash, fileIndex) => set({ previewHash: hash, previewFileIndex: fileIndex ?? null }),
  closePreview: () => set({ previewHash: null, previewFileIndex: null }),

  // Bulk selection
  selectedTorrents: new Set<string>(),
  selectionMode: false,
  toggleTorrentSelection: (hash) =>
    set((s) => {
      const next = new Set(s.selectedTorrents);
      if (next.has(hash)) next.delete(hash);
      else next.add(hash);
      return { selectedTorrents: next, lastSelectedTorrent: hash };
    }),
  lastSelectedTorrent: null,
  visibleHashes: [],
  setVisibleHashes: (hashes) => set((s) => (s.visibleHashes.join() === hashes.join() ? s : { visibleHashes: hashes })),
  // Shift-click: select everything between the last clicked card and this one
  selectRange: (hashes, toHash) =>
    set((s) => {
      const a = s.lastSelectedTorrent ? hashes.indexOf(s.lastSelectedTorrent) : -1;
      const b = hashes.indexOf(toHash);
      if (a === -1 || b === -1) return { selectedTorrents: new Set(s.selectedTorrents).add(toHash), lastSelectedTorrent: toHash };
      const next = new Set(s.selectedTorrents);
      for (const h of hashes.slice(Math.min(a, b), Math.max(a, b) + 1)) next.add(h);
      return { selectedTorrents: next, lastSelectedTorrent: toHash };
    }),
  selectAllTorrents: (hashes) => set({ selectedTorrents: new Set(hashes) }),
  deselectAllTorrents: () => set({ selectedTorrents: new Set(), selectionMode: false, lastSelectedTorrent: null }),
  setSelectionMode: (on) => set({ selectionMode: on, selectedTorrents: new Set(), lastSelectedTorrent: null }),

  setSelectedTorrent: (hash) => set({ selectedTorrent: hash }),
  setShowAddModal: (show) => set({ showAddModal: show }),
  setShowSettingsModal: (show) => set({ showSettingsModal: show }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setFilterCategory: (id) => set({ filterCategory: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
