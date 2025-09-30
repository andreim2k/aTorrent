// WebSocket Client for Real-time Updates
class TorrentWebSocket {
  constructor() {
    this.ws = null;
    this.reconnectInterval = 5000;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.listeners = new Map();
    this.isConnected = false;
    this.shouldReconnect = true;
  }

  connect() {
    // Don't create a new connection if one already exists and is open
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }
    
    // Use direct connection to backend port
    const wsUrl = 'ws://prometheus:8000/ws';
    
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Send subscribe message
        this.send({ type: 'subscribe' });
        
        // Notify listeners
        this.emit('connected');
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error, 'Raw data:', event.data);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };
      
      this.ws.onclose = () => {
        this.isConnected = false;
        this.emit('disconnected');
        
        // Attempt to reconnect
        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => this.connect(), this.reconnectInterval);
        }
      };
      
      // Send ping every 30 seconds to keep connection alive
      this.pingInterval = setInterval(() => {
        if (this.isConnected) {
          this.send({ type: 'ping' });
        }
      }, 30000);
      
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }
  
  handleMessage(message) {
    // Handle different message types
    switch (message.type) {
      case 'torrent_update':
        this.emit('torrent_update', message.data);
        break;
      case 'stats_update':
        this.emit('stats_update', message.data);
        break;
      case 'pong':
        // Keep-alive response
        break;
      case 'subscribed':
        break;
      default:
        this.emit('message', message);
    }
  }
  
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
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
          console.error(`Error in WebSocket listener for event ${event}:`, error);
        }
      });
    }
  }
  
  disconnect() {
    this.shouldReconnect = false;
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Create global instance if it doesn't exist
if (!window.torrentWS) {
  window.torrentWS = new TorrentWebSocket();
}
