import { useEffect, useState } from 'react';
import { useTorrents } from '../../hooks/useTorrents.js';
import type { Torrent } from '../../types/index.js';

export function StatusBar() {
  const { data: torrents } = useTorrents();
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const list = torrents || [];
  const active = list.filter((t: Torrent) => t.status === 'downloading').length;

  return (
    <footer className="holo-statusbar">
      <span className="holo-statusbar__mode">READY</span>
      <span><b>{String(list.length).padStart(2, '0')}</b> JOBS</span>
      <span><b>{String(active).padStart(2, '0')}</b> ACTIVE</span>
      <span className="opt">LINK ESTABLISHED</span>
      <span className="holo-statusbar__spacer" />
      <span className="opt">v0.1.0</span>
      <span>{time.toLocaleTimeString([], { hour12: false })}</span>
    </footer>
  );
}
