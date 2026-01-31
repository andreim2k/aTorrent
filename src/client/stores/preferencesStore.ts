import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PreferencesState {
  showSpeedGraph: boolean;
  setShowSpeedGraph: (v: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      showSpeedGraph: true,
      setShowSpeedGraph: (v) => set({ showSpeedGraph: v }),
    }),
    { name: 'atorrent-prefs' }
  )
);
