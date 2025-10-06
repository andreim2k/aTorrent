// Torrent Manager Module
class TorrentManager {
  constructor() {
    this.torrents = new Map();
    this.listeners = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    // Wait for API client to initialize
    if (!window.apiClient.isInitialized) {
      await window.apiClient.initialize();
    }
    
    this.isInitialized = true;
    this.emit('initialized');
  }

  async loadTorrents() {
    try {
      const torrents = await window.apiClient.get('/api/v1/torrents');
      this.torrents.clear();
      
      torrents.forEach(torrent => {
        this.torrents.set(torrent.id, torrent);
      });
      
      this.emit('torrents_loaded', Array.from(this.torrents.values()));
      return Array.from(this.torrents.values());
    } catch (error) {
      console.error('Failed to load torrents:', error);
      this.emit('error', { action: 'load_torrents', error });
      throw error;
    }
  }

  async addTorrent(torrentFile, autoStart = true) {
    try {
      const result = await window.apiClient.post('/api/v1/torrents', {
        torrent_file: torrentFile,
        auto_start: autoStart
      });
      
      this.emit('torrent_added', result);
      return result;
    } catch (error) {
      console.error('Failed to add torrent:', error);
      this.emit('error', { action: 'add_torrent', error });
      throw error;
    }
  }

  async pauseTorrent(torrentId) {
    try {
      const result = await window.apiClient.post(`/api/v1/torrents/${torrentId}/pause`);
      
      // Update local state
      if (this.torrents.has(torrentId)) {
        this.torrents.get(torrentId).status = 'paused';
      }
      
      this.emit('torrent_paused', { torrentId, result });
      return result;
    } catch (error) {
      console.error('Failed to pause torrent:', error);
      this.emit('error', { action: 'pause_torrent', torrentId, error });
      throw error;
    }
  }

  async resumeTorrent(torrentId) {
    try {
      const result = await window.apiClient.post(`/api/v1/torrents/${torrentId}/resume`);
      
      // Update local state
      if (this.torrents.has(torrentId)) {
        const torrent = this.torrents.get(torrentId);
        torrent.status = torrent.progress >= 1.0 ? 'seeding' : 'downloading';
      }
      
      this.emit('torrent_resumed', { torrentId, result });
      return result;
    } catch (error) {
      console.error('Failed to resume torrent:', error);
      this.emit('error', { action: 'resume_torrent', torrentId, error });
      throw error;
    }
  }

  async deleteTorrent(torrentId, deleteFiles = false) {
    try {
      const result = await window.apiClient.delete(`/api/v1/torrents/${torrentId}?delete_files=${deleteFiles}`);
      
      // Remove from local state
      this.torrents.delete(torrentId);
      
      this.emit('torrent_deleted', { torrentId, result });
      return result;
    } catch (error) {
      console.error('Failed to delete torrent:', error);
      this.emit('error', { action: 'delete_torrent', torrentId, error });
      throw error;
    }
  }

  async bulkPause(torrentIds) {
    try {
      const result = await window.apiClient.post('/api/v1/torrents/bulk/pause', {
        torrent_ids: torrentIds
      });
      
      // Update local state
      torrentIds.forEach(id => {
        if (this.torrents.has(id)) {
          this.torrents.get(id).status = 'paused';
        }
      });
      
      this.emit('bulk_paused', { torrentIds, result });
      return result;
    } catch (error) {
      console.error('Failed to bulk pause torrents:', error);
      this.emit('error', { action: 'bulk_pause', torrentIds, error });
      throw error;
    }
  }

  async bulkResume(torrentIds) {
    try {
      const result = await window.apiClient.post('/api/v1/torrents/bulk/resume', {
        torrent_ids: torrentIds
      });
      
      // Update local state
      torrentIds.forEach(id => {
        if (this.torrents.has(id)) {
          const torrent = this.torrents.get(id);
          torrent.status = torrent.progress >= 1.0 ? 'seeding' : 'downloading';
        }
      });
      
      this.emit('bulk_resumed', { torrentIds, result });
      return result;
    } catch (error) {
      console.error('Failed to bulk resume torrents:', error);
      this.emit('error', { action: 'bulk_resume', torrentIds, error });
      throw error;
    }
  }

  async bulkDelete(torrentIds, deleteFiles = false) {
    try {
      const result = await window.apiClient.delete(`/api/v1/torrents/bulk?delete_files=${deleteFiles}`, {
        torrent_ids: torrentIds
      });
      
      // Remove from local state
      torrentIds.forEach(id => {
        this.torrents.delete(id);
      });
      
      this.emit('bulk_deleted', { torrentIds, result });
      return result;
    } catch (error) {
      console.error('Failed to bulk delete torrents:', error);
      this.emit('error', { action: 'bulk_delete', torrentIds, error });
      throw error;
    }
  }

  getTorrent(torrentId) {
    return this.torrents.get(torrentId);
  }

  getAllTorrents() {
    return Array.from(this.torrents.values());
  }

  updateTorrent(torrentId, updates) {
    if (this.torrents.has(torrentId)) {
      const torrent = this.torrents.get(torrentId);
      Object.assign(torrent, updates);
      this.emit('torrent_updated', { torrentId, torrent });
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in torrent manager listener for event ${event}:`, error);
        }
      });
    }
  }
}

// Create global instance
if (!window.torrentManager) {
  window.torrentManager = new TorrentManager();
}

