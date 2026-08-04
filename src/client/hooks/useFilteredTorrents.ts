import { useMemo } from 'react';
import { useTorrents } from './useTorrents.js';
import { useUIStore } from '../stores/uiStore.js';
import type { Torrent } from '../types/index.js';

/**
 * The visible transfer set, after status filter and search.
 *
 * The queue and the bulk-action dock must agree on what "all" means: if the
 * dock selected from the unfiltered list, "Select all" during a search would
 * quietly arm rows the operator cannot see — and the next Remove would take
 * them with it. One definition, used by both.
 */
export function useFilteredTorrents() {
  const { data: torrents, isLoading } = useTorrents();
  const filterStatus = useUIStore((s) => s.filterStatus);
  const searchQuery = useUIStore((s) => s.searchQuery);

  const filtered = useMemo(() => {
    let list: Torrent[] = torrents || [];

    if (filterStatus !== 'all') {
      list = filterStatus === 'completed'
        ? list.filter((t) => t.status === 'seeding' || t.progress >= 1)
        : list.filter((t) => t.status === filterStatus);
    }

    if (searchQuery) {
      const needle = searchQuery.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(needle));
    }

    return list;
  }, [torrents, filterStatus, searchQuery]);

  return { torrents: filtered, isLoading };
}
