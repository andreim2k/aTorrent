import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultTheme, type ThemeId } from '../lib/themes.js';

const MIN_FONT_SCALE = 0.85;
const MAX_FONT_SCALE = 1.3;
const FONT_SCALE_STEP = 0.1;

interface PreferencesState {
  showSpeedGraph: boolean;
  theme: ThemeId;
  fontScale: number;
  setShowSpeedGraph: (value: boolean) => void;
  setTheme: (theme: ThemeId) => void;
  increaseFontScale: () => void;
  decreaseFontScale: () => void;
  resetFontScale: () => void;
}

const clampScale = (value: number) => Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, Number(value.toFixed(2))));

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      showSpeedGraph: true,
      theme: defaultTheme,
      fontScale: 1,
      setShowSpeedGraph: (showSpeedGraph) => set({ showSpeedGraph }),
      setTheme: (theme) => set({ theme }),
      increaseFontScale: () => set((state) => ({ fontScale: clampScale(state.fontScale + FONT_SCALE_STEP) })),
      decreaseFontScale: () => set((state) => ({ fontScale: clampScale(state.fontScale - FONT_SCALE_STEP) })),
      resetFontScale: () => set({ fontScale: 1 }),
    }),
    { name: 'atorrent-prefs' }
  )
);
