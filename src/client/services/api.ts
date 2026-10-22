const BASE = (import.meta.env.VITE_API_URL as string) || '/api';

const GET_TIMEOUT_MS = 6000;
const GET_ATTEMPTS = 3;

/**
 * Mobile networks can leave a pooled keep-alive connection dead without telling the browser, so a request
 * on it just hangs. Reads are idempotent: give up after a few seconds and retry, which opens a new connection.
 */
async function fetchWithRetry(input: string, init: RequestInit): Promise<Response> {
  const isRead = !init.method || init.method === 'GET';
  if (!isRead) return fetch(input, init);
  let lastError: unknown;
  for (let attempt = 0; attempt < GET_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GET_TIMEOUT_MS);
    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } catch (err) {
      lastError = err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Network request failed');
}

async function request<T>(url: string, opts?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { ...opts?.headers as Record<string, string> };
  if (opts?.body) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetchWithRetry(BASE + url, {
    ...opts,
    credentials: 'include',
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || res.statusText);
  }
  return res.json();
}

export const api = {
  // Torrents
  getTorrents: (params?: { status?: string; category?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<any[]>(`/torrents${qs ? '?' + qs : ''}`);
  },
  getTorrent: (hash: string) => request<any>(`/torrents/${hash}`),
  addTorrentMagnet: (magnet: string) =>
    request('/torrents', { method: 'POST', body: JSON.stringify({ magnet }) }),
  addTorrentFile: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return fetch(BASE + '/torrents', { method: 'POST', body: form, credentials: 'include' }).then(r => r.json());
  },
  updateTorrent: (hash: string, data: any) =>
    request(`/torrents/${hash}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTorrent: (hash: string, deleteFiles = false) =>
    request(`/torrents/${hash}?deleteFiles=${deleteFiles}`, { method: 'DELETE' }),
  getTorrentFiles: (hash: string) => request<any[]>(`/torrents/${hash}/files`),
  identifyTorrent: (hash: string, tmdbId: number, mediaType: string) =>
    request(`/torrents/${hash}/identify`, { method: 'POST', body: JSON.stringify({ tmdbId, mediaType }) }),

  // Categories
  getCategories: () => request<any[]>('/categories'),
  addCategory: (name: string, savePath?: string) =>
    request('/categories', { method: 'POST', body: JSON.stringify({ name, savePath }) }),
  deleteCategory: (id: number) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => request<Record<string, any>>('/settings'),
  updateSettings: (data: Record<string, any>) =>
    request('/settings', { method: 'PATCH', body: JSON.stringify(data) }),

  // TMDB
  searchTMDB: (q: string, type?: string) =>
    request<any>(`/tmdb/search?q=${encodeURIComponent(q)}${type ? '&type=' + type : ''}`),

  getTorrentTMDB: (hash: string) => request<any>(`/torrents/${hash}/tmdb`),

  // System
  getSystemInfo: () => request<any>('/system'),

  // Batch operations
  batchPauseTorrents: (hashes: string[]) =>
    request('/torrents/batch/pause', { method: 'POST', body: JSON.stringify({ hashes }) }),
  batchResumeTorrents: (hashes: string[]) =>
    request('/torrents/batch/resume', { method: 'POST', body: JSON.stringify({ hashes }) }),
  batchDeleteTorrents: (hashes: string[], deleteFiles: boolean) =>
    request('/torrents/batch/delete', { method: 'POST', body: JSON.stringify({ hashes, deleteFiles }) }),
};
