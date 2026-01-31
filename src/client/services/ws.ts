type Listener = (data: any) => void;

const WS_RECONNECT_DELAY_MS = 1000;
const WS_MAX_RECONNECT_DELAY_MS = 30000;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<Listener>>();
  private reconnectDelay = WS_RECONNECT_DELAY_MS;
  private maxDelay = WS_MAX_RECONNECT_DELAY_MS;
  private currentDelay = WS_RECONNECT_DELAY_MS;

  connect() {
    let wsUrl: string;
    const apiUrl = import.meta.env.VITE_API_URL as string;
    if (apiUrl) {
      wsUrl = apiUrl.replace(/^http/, 'ws').replace(/\/api\/?$/, '') + '/ws';
    } else {
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${location.host}/ws`;
    }
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.currentDelay = this.reconnectDelay;
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const listeners = this.listeners.get(msg.type);
        if (listeners) {
          for (const fn of listeners) fn(msg.data);
        }
      } catch {}
    };

    this.ws.onclose = () => {
      setTimeout(() => this.connect(), this.currentDelay);
      this.currentDelay = Math.min(this.currentDelay * 2, this.maxDelay);
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  on(event: string, fn: Listener) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
    return () => this.listeners.get(event)?.delete(fn);
  }

  disconnect() {
    this.ws?.close();
  }
}

export const wsClient = new WebSocketClient();
