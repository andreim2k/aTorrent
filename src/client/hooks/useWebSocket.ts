import { useEffect } from 'react';
import { wsClient } from '../services/ws.js';

export function useWebSocket(event: string, handler: (data: any) => void) {
  useEffect(() => {
    return wsClient.on(event, handler);
  }, [event, handler]);
}
