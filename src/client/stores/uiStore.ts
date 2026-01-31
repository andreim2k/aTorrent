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

  // Delete confirmation
  deleteConfirmHashes: string[];
  setDeleteConfirmHashes: (hashes: string[]) => void;
  clearDeleteConfirm: () => void;

  // Bulk selection
  selectedTorrents: Set<string>;
  selectionMode: boolean;
  toggleTorrentSelection: (hash: string) => void;
  selectAllTorrents: (hashes: string[]) => void;
  deselectAllTorrents: () => void;
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
  sidebarCollapsed: false,

  // Delete confirmation
  deleteConfirmHashes: [],
  setDeleteConfirmHashes: (hashes) => set({ deleteConfirmHashes: hashes }),
  clearDeleteConfirm: () => set({ deleteConfirmHashes: [] }),

  // Bulk selection
  selectedTorrents: new Set<string>(),
  selectionMode: false,
  toggleTorrentSelection: (hash) =>
    set((s) => {
      const next = new Set(s.selectedTorrents);
      if (next.has(hash)) next.delete(hash);
      else next.add(hash);
      return { selectedTorrents: next };
    }),
  selectAllTorrents: (hashes) => set({ selectedTorrents: new Set(hashes) }),
  deselectAllTorrents: () => set({ selectedTorrents: new Set(), selectionMode: false }),
  setSelectionMode: (on) => set({ selectionMode: on, selectedTorrents: on ? new Set() : new Set() }),

  setSelectedTorrent: (hash) => set({ selectedTorrent: hash }),
  setShowAddModal: (show) => set({ showAddModal: show }),
  setShowSettingsModal: (show) => set({ showSettingsModal: show }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setFilterCategory: (id) => set({ filterCategory: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
