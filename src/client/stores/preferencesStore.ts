import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MIN_FONT_SCALE = 0.85;
const MAX_FONT_SCALE = 1.3;
const FONT_SCALE_STEP = 0.05;

interface PreferencesState {
  showSpeedGraph: boolean;
  fontScale: number;
  /** Ambient motion (scan beam, pulses, sweeps). Static HOLO renders regardless. */
  fxEnabled: boolean;
  setShowSpeedGraph: (value: boolean) => void;
  increaseFontScale: () => void;
  decreaseFontScale: () => void;
  resetFontScale: () => void;
  toggleFx: () => void;
}

const clampScale = (value: number) => Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, Number(value.toFixed(2))));

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      showSpeedGraph: true,
      fontScale: 1,
      fxEnabled: true,
      setShowSpeedGraph: (showSpeedGraph) => set({ showSpeedGraph }),
      increaseFontScale: () => set((state) => ({ fontScale: clampScale(state.fontScale + FONT_SCALE_STEP) })),
      decreaseFontScale: () => set((state) => ({ fontScale: clampScale(state.fontScale - FONT_SCALE_STEP) })),
      resetFontScale: () => set({ fontScale: 1 }),
      toggleFx: () => set((state) => ({ fxEnabled: !state.fxEnabled })),
    }),
    { name: 'atorrent-holo-prefs' }
  )
);

export const FONT_SCALE_BOUNDS = { min: MIN_FONT_SCALE, max: MAX_FONT_SCALE };
