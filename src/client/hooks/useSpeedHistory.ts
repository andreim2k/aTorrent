import { useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket.js';
import { useTorrents } from './useTorrents.js';

interface SpeedPoint {
  time: number;
  download: number;
  upload: number;
}

const MAX_POINTS = 60;
const DEDUP_THRESHOLD_MS = 500;

export function useSpeedHistory() {
  const [history, setHistory] = useState<SpeedPoint[]>([]);
  const { data: torrents } = useTorrents();

  const handleProgress = useCallback((data: any) => {
    setHistory(prev => {
      const existing = prev.find(p => Math.abs(p.time - Date.now()) < DEDUP_THRESHOLD_MS);
      if (existing) {
        return prev.map(p =>
          p === existing
            ? { ...p, download: p.download + data.downloadSpeed, upload: p.upload + data.uploadSpeed }
            : p
        );
      }
      const next = [...prev, { time: Date.now(), download: data.downloadSpeed, upload: data.uploadSpeed }];
      return next.slice(-MAX_POINTS);
    });
  }, []);

  const handleRemoved = useCallback(() => {
    // Push a zero point so the graph drops to zero; if no torrents left, clear entirely
    setHistory(prev => {
      if (!prev.length) return prev;
      const zero = { time: Date.now(), download: 0, upload: 0 };
      return [...prev, zero].slice(-MAX_POINTS);
    });
  }, []);

  useWebSocket('torrent:progress', handleProgress);
  useWebSocket('torrent:removed', handleRemoved);

  // If no torrents exist, return empty to hide the graph
  if (!torrents || torrents.length === 0) {
    return [];
  }

  return history;
}
