'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Torrent } from '@/types';

/**
 * Hook for real-time torrent progress updates
 * Continuously updates progress, speeds, and ETA based on current download speed
 */
export function useRealTimeTorrents(serverTorrents?: Torrent[], isEnabled: boolean = true) {
  const [currentTorrents, setCurrentTorrents] = useState<Torrent[]>(serverTorrents || []);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  // Update when server data changes
  useEffect(() => {
    if (serverTorrents) {
      setCurrentTorrents(serverTorrents);
      lastUpdateRef.current = Date.now();
    }
  }, [serverTorrents]);

  // Real-time updates
  useEffect(() => {
    if (!isEnabled || !serverTorrents || serverTorrents.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Update every second
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = (now - lastUpdateRef.current) / 1000;
      
      setCurrentTorrents(prevTorrents => 
        prevTorrents.map(torrent => {
          // Only update downloading torrents
          if (torrent.status !== 'downloading' || torrent.download_speed <= 0) {
            return torrent;
          }

          // Calculate new downloaded amount
          const additionalBytes = torrent.download_speed * deltaSeconds;
          const newDownloaded = Math.min(torrent.downloaded + additionalBytes, torrent.total_size);
          const newProgress = torrent.total_size > 0 ? newDownloaded / torrent.total_size : torrent.progress;

          // Calculate new ETA
          const remainingBytes = torrent.total_size - newDownloaded;
          const newEta = torrent.download_speed > 0 ? remainingBytes / torrent.download_speed : -1;

          return {
            ...torrent,
            downloaded: newDownloaded,
            progress: newProgress,
            eta: newEta
          };
        })
      );
      
      lastUpdateRef.current = now;
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isEnabled, serverTorrents]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return currentTorrents;
}

/**
 * Hook for real-time statistics updates
 * Updates download/upload rates
 */
interface SessionStats {
  download_rate?: number;
  upload_rate?: number;
  num_peers?: number;
  port?: number;
  dht_nodes?: number;
  libtorrent_version?: string;
  uptime?: number;
}

export function useRealTimeStats(serverStats?: SessionStats, isEnabled: boolean = true) {
  // Simply return the server stats as-is since we no longer accumulate session totals
  return serverStats || {};
}

/**
 * Hook for real-time torrent statistics
 * Updates aggregate stats based on torrent data
 */
interface TorrentStats {
  total_torrents?: number;
  active_torrents?: number;
  downloading?: number;
  seeding?: number;
  paused?: number;
  total_downloaded?: number;
  total_uploaded?: number;
  total_download_speed?: number;
  total_upload_speed?: number;
}

export function useRealTimeTorrentStats(torrents?: Torrent[], serverStats?: TorrentStats, isEnabled: boolean = true) {
  const [currentStats, setCurrentStats] = useState<TorrentStats>(serverStats || {});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  // Calculate stats from current torrents
  const calculateStatsFromTorrents = useCallback((torrents: Torrent[]) => {
    if (!torrents || torrents.length === 0) {
      return {
        total_torrents: 0,
        active_torrents: 0,
        downloading: 0,
        seeding: 0,
        paused: 0,
        total_downloaded: 0,
        total_uploaded: 0,
        total_download_speed: 0,
        total_upload_speed: 0,
      };
    }

    const stats = {
      total_torrents: torrents.length,
      active_torrents: torrents.filter(t => t.status === 'downloading' || t.status === 'seeding').length,
      downloading: torrents.filter(t => t.status === 'downloading').length,
      seeding: torrents.filter(t => t.status === 'seeding').length,
      paused: torrents.filter(t => t.status === 'paused').length,
      total_downloaded: torrents.reduce((sum, t) => sum + (t.downloaded || 0), 0),
      total_uploaded: torrents.reduce((sum, t) => sum + (t.uploaded || 0), 0),
      total_download_speed: torrents.reduce((sum, t) => sum + (t.download_speed || 0), 0),
      total_upload_speed: torrents.reduce((sum, t) => sum + (t.upload_speed || 0), 0),
    };

    return stats;
  }, []);

  // Update when server data or torrents change
  useEffect(() => {
    if (torrents) {
      const calculatedStats = calculateStatsFromTorrents(torrents);
      setCurrentStats(calculatedStats);
      lastUpdateRef.current = Date.now();
    } else if (serverStats) {
      setCurrentStats(serverStats);
      lastUpdateRef.current = Date.now();
    }
  }, [serverStats, torrents]);

  // Real-time updates based on current speeds
  useEffect(() => {
    if (!isEnabled || !torrents || torrents.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Update every second
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = (now - lastUpdateRef.current) / 1000;
      
      setCurrentStats(prevStats => {
        const currentDownloadSpeed = prevStats.total_download_speed || 0;
        const currentUploadSpeed = prevStats.total_upload_speed || 0;

        if (currentDownloadSpeed === 0 && currentUploadSpeed === 0) {
          return prevStats;
        }

        // Calculate additional data transferred
        const additionalDownload = currentDownloadSpeed * deltaSeconds;
        const additionalUpload = currentUploadSpeed * deltaSeconds;

        return {
          ...prevStats,
          total_downloaded: (prevStats.total_downloaded || 0) + additionalDownload,
          total_uploaded: (prevStats.total_uploaded || 0) + additionalUpload,
        };
      });
      
      lastUpdateRef.current = now;
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isEnabled, torrents]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return currentStats;
}
