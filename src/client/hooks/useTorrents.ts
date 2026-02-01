import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import { api } from '../services/api.js';
import { useWebSocket } from './useWebSocket.js';
import type { Torrent } from '../types/index.js';

export function useTorrents() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['torrents'],
    queryFn: api.getTorrents,
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
    onSuccess: () => qc.refetchQueries({ queryKey: ['torrents'] }),
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
    },
    onSuccess: () => qc.refetchQueries({ queryKey: ['torrents'] }),
  });
}

export function useUpdateTorrent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ hash, data }: { hash: string; data: any }) =>
      api.updateTorrent(hash, data),
    onSuccess: () => qc.refetchQueries({ queryKey: ['torrents'] }),
  });
}

export function useBatchPause() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (hashes: string[]) => api.batchPauseTorrents(hashes),
    onSuccess: () => qc.refetchQueries({ queryKey: ['torrents'] }),
  });
}

export function useBatchResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (hashes: string[]) => api.batchResumeTorrents(hashes),
    onSuccess: () => qc.refetchQueries({ queryKey: ['torrents'] }),
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
    },
    onSuccess: () => qc.refetchQueries({ queryKey: ['torrents'] }),
  });
}
