import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import { api } from '../services/api.js';
import { useWebSocket } from './useWebSocket.js';
import { useUIStore } from '../stores/uiStore.js';
import { usePreferencesStore } from '../stores/preferencesStore.js';
import { toast } from '../stores/toastStore.js';
import { parseRelease } from '../lib/release.js';
import type { Torrent } from '../types/index.js';

export function useTorrents() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['torrents'],
    queryFn: () => api.getTorrents(),
    staleTime: Infinity,
  });

  // WS-driven cache updates
  const handleProgress = useCallback((data: any) => {
    qc.setQueryData<Torrent[]>(['torrents'], (old) => {
      if (!old) return old;
      return old.map(t =>
        t.infoHash === data.infoHash ? { ...t, ...data, status: t.status === 'paused' ? 'paused' : t.status } : t
      );
    });
  }, [qc]);

  const handleAdded = useCallback(() => {
    qc.refetchQueries({ queryKey: ['torrents'] });
  }, [qc]);

  const handleRemoved = useCallback((data: any) => {
    qc.setQueryData<Torrent[]>(['torrents'], (old) =>
      old?.filter(t => t.infoHash !== data.infoHash)
    );
  }, [qc]);

  const handleDone = useCallback((data: any) => {
    const name = qc.getQueryData<Torrent[]>(['torrents'])?.find(t => t.infoHash === data.infoHash)?.name;
    if (name) toast.success('Download complete', parseRelease(name).title);
    qc.setQueryData<Torrent[]>(['torrents'], (old) =>
      old?.map(t => t.infoHash === data.infoHash ? { ...t, status: 'seeding' as const } : t)
    );
  }, [qc]);

  const handleIdentified = useCallback((_data: any) => {
    qc.refetchQueries({ queryKey: ['torrents'] });
  }, [qc]);

  const handleMetadata = useCallback((_data: any) => {
    qc.refetchQueries({ queryKey: ['torrents'] });
  }, [qc]);

  useWebSocket('torrent:progress', handleProgress);
  useWebSocket('torrent:added', handleAdded);
  useWebSocket('torrent:removed', handleRemoved);
  useWebSocket('torrent:done', handleDone);
  useWebSocket('torrent:metadata', handleMetadata);
  useWebSocket('torrent:identified', handleIdentified);

  return query;
}

export function useAddTorrent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (magnet: string) => api.addTorrentMagnet(magnet),
    onSuccess: () => {
      toast.success('Torrent added', 'Fetching metadata…');
      qc.refetchQueries({ queryKey: ['torrents'] });
    },
    onError: (e: Error) => toast.error('Could not add torrent', e.message),
  });
}

export function useDeleteTorrent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ hash, deleteFiles }: { hash: string; deleteFiles?: boolean }) =>
      api.deleteTorrent(hash, deleteFiles),
    onMutate: ({ hash }) => {
      const previous = qc.getQueryData<Torrent[]>(['torrents']);
      qc.setQueryData<Torrent[]>(['torrents'], (old) =>
        old?.filter(t => t.infoHash !== hash)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(['torrents'], context.previous);
      }
      toast.error('Could not delete torrent');
    },
    onSuccess: () => {
      toast.info('Torrent removed');
      qc.refetchQueries({ queryKey: ['torrents'] });
    },
  });
}

export function useUpdateTorrent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ hash, data }: { hash: string; data: any }) =>
      api.updateTorrent(hash, data),
    onSuccess: (_r, { data }) => {
      if (data?.status === 'paused') toast.info('Paused');
      else if (data?.status === 'downloading') toast.info('Resumed');
      qc.refetchQueries({ queryKey: ['torrents'] });
    },
    onError: (e: Error) => toast.error('Update failed', e.message),
  });
}

export function useBatchPause() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (hashes: string[]) => api.batchPauseTorrents(hashes),
    onSuccess: (_r, hashes) => {
      toast.info(`Paused ${hashes.length} torrent${hashes.length === 1 ? '' : 's'}`);
      qc.refetchQueries({ queryKey: ['torrents'] });
    },
    onError: (e: Error) => toast.error('Pause failed', e.message),
  });
}

export function useBatchResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (hashes: string[]) => api.batchResumeTorrents(hashes),
    onSuccess: (_r, hashes) => {
      toast.info(`Resumed ${hashes.length} torrent${hashes.length === 1 ? '' : 's'}`);
      qc.refetchQueries({ queryKey: ['torrents'] });
    },
    onError: (e: Error) => toast.error('Resume failed', e.message),
  });
}

export function useBatchDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ hashes, deleteFiles }: { hashes: string[]; deleteFiles: boolean }) =>
      api.batchDeleteTorrents(hashes, deleteFiles),
    onMutate: ({ hashes }) => {
      const previous = qc.getQueryData<Torrent[]>(['torrents']);
      const hashSet = new Set(hashes);
      qc.setQueryData<Torrent[]>(['torrents'], (old) =>
        old?.filter(t => !hashSet.has(t.infoHash))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(['torrents'], context.previous);
      }
      toast.error('Could not delete torrents');
    },
    onSuccess: (_r, { hashes }) => {
      toast.info(`Removed ${hashes.length} torrent${hashes.length === 1 ? '' : 's'}`);
      qc.refetchQueries({ queryKey: ['torrents'] });
    },
  });
}

/** Torrents matching the current status filter and search query. */
export function useVisibleTorrents() {
  const { data: torrents, isLoading } = useTorrents();
  const filterStatus = useUIStore((s) => s.filterStatus);
  const searchQuery = useUIStore((s) => s.searchQuery);
  const sortKey = usePreferencesStore((s) => s.sortKey);
  const sortDir = usePreferencesStore((s) => s.sortDir);

  let filtered = torrents || [];
  if (filterStatus === 'completed') {
    filtered = filtered.filter((t) => t.status === 'seeding' || t.progress >= 1);
  } else if (filterStatus !== 'all') {
    filtered = filtered.filter((t) => t.status === filterStatus);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((t) => t.name.toLowerCase().includes(q));
  }

  const dir = sortDir === 'asc' ? 1 : -1;
  const sorted = [...filtered].sort((a, b) => {
    switch (sortKey) {
      case 'name': return dir * a.name.localeCompare(b.name, undefined, { numeric: true });
      case 'progress': return dir * (a.progress - b.progress);
      case 'size': return dir * (a.totalSize - b.totalSize);
      case 'speed': return dir * ((a.downloadSpeed + a.uploadSpeed) - (b.downloadSpeed + b.uploadSpeed));
      default: return dir * (new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
    }
  });
  return { torrents: sorted, isLoading };
}

export function useSystemInfo() {
  return useQuery({
    queryKey: ['system'],
    queryFn: () => api.getSystemInfo(),
    refetchInterval: 15000,
    retry: false,
  });
}
