import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api.js';

const TMDB_STALE_TIME_MS = 5 * 60 * 1000;

export function useTMDBSearch(query: string, type?: string) {
  return useQuery({
    queryKey: ['tmdb-search', query, type],
    queryFn: () => api.searchTMDB(query, type),
    enabled: query.length > 2,
    staleTime: TMDB_STALE_TIME_MS,
  });
}
