import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewMode = 'list' | 'grid';
export type SortKey = 'added' | 'name' | 'progress' | 'size' | 'speed';

interface PreferencesState {
  showSpeedGraph: boolean;
  setShowSpeedGraph: (v: boolean) => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  sortKey: SortKey;
  sortDir: 'asc' | 'desc';
  setSort: (key: SortKey) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      showSpeedGraph: true,
      setShowSpeedGraph: (v) => set({ showSpeedGraph: v }),
      viewMode: 'list',
      setViewMode: (viewMode) => set({ viewMode }),
      sortKey: 'added',
      sortDir: 'desc',
      // Picking the active key flips direction; a new key starts at its natural direction
      setSort: (key) =>
        set((s) =>
          s.sortKey === key
            ? { sortDir: s.sortDir === 'asc' ? 'desc' : 'asc' }
            : { sortKey: key, sortDir: key === 'name' ? 'asc' : 'desc' }
        ),
    }),
    { name: 'atorrent-prefs' }
  )
);
