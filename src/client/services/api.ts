const BASE = (import.meta.env.VITE_API_URL as string) || '/api';

async function request<T>(url: string, opts?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { ...opts?.headers as Record<string, string> };
  if (opts?.body) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(BASE + url, {
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
  // Auth
  authStatus: () => request<{ setupRequired: boolean; authenticated: boolean; username: string | null }>('/auth/status'),
  setup: (username: string, password: string) =>
    request('/auth/setup', { method: 'POST', body: JSON.stringify({ username, password }) }),
  login: (username: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),

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

  // Batch operations
  batchPauseTorrents: (hashes: string[]) =>
    request('/torrents/batch/pause', { method: 'POST', body: JSON.stringify({ hashes }) }),
  batchResumeTorrents: (hashes: string[]) =>
    request('/torrents/batch/resume', { method: 'POST', body: JSON.stringify({ hashes }) }),
  batchDeleteTorrents: (hashes: string[], deleteFiles: boolean) =>
    request('/torrents/batch/delete', { method: 'POST', body: JSON.stringify({ hashes, deleteFiles }) }),
};
