import { useEffect, useState } from 'react';
import { useTorrents } from '../../hooks/useTorrents.js';

export function StatusBar() {
  const { data: torrents } = useTorrents();
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <footer className="terminal-statusbar">
      <span className="status-mode">NORMAL</span>
      <span><b>↳</b> {torrents?.length || 0} JOBS</span>
      <span><b>◆</b> WS:CONNECTED</span>
      <span className="status-spacer" />
      <span>UTF-8</span>
      <span>v0.1.0</span>
      <span>{time.toLocaleTimeString([], { hour12: false })}</span>
    </footer>
  );
}
