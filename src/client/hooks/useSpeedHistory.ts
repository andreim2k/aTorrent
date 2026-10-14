import { useEffect } from 'react';
import { create } from 'zustand';
import { useQueryClient } from '@tanstack/react-query';
import type { Torrent } from '../types/index.js';

export interface SpeedPoint {
  t: number;
  dl: number;
  ul: number;
}

const MAX_POINTS = 90;
const SAMPLE_MS = 1000;

const blank = (): SpeedPoint[] =>
  Array.from({ length: MAX_POINTS }, (_, i) => ({ t: Date.now() - (MAX_POINTS - i) * SAMPLE_MS, dl: 0, ul: 0 }));

interface SpeedState {
  points: SpeedPoint[];
  push: (p: SpeedPoint) => void;
}

export const useSpeedStore = create<SpeedState>((set) => ({
  points: blank(),
  push: (p) => set((s) => ({ points: [...s.points.slice(-(MAX_POINTS - 1)), p] })),
}));

/** Samples aggregate speeds once a second. Mount exactly once, near the app root. */
export function useSpeedSampler() {
  const qc = useQueryClient();
  const push = useSpeedStore((s) => s.push);

  useEffect(() => {
    const id = setInterval(() => {
      const list = qc.getQueryData<Torrent[]>(['torrents']) ?? [];
      let dl = 0;
      let ul = 0;
      for (const t of list) {
        dl += t.downloadSpeed || 0;
        ul += t.uploadSpeed || 0;
      }
      push({ t: Date.now(), dl, ul });
    }, SAMPLE_MS);
    return () => clearInterval(id);
  }, [qc, push]);
}
