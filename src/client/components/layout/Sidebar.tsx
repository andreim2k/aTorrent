import { cn } from '../../lib/cn.js';
import { useUIStore } from '../../stores/uiStore.js';
import { useTorrents } from '../../hooks/useTorrents.js';
import { formatSpeed } from '../../lib/formatters.js';
import type { FilterStatus, Torrent } from '../../types/index.js';

const navItems: { label: string; command: string; status: FilterStatus; icon: string }[] = [
  { label: 'All transfers', command: 'ls -la', status: 'all', icon: '00' },
  { label: 'Downloading', command: 'watch dl', status: 'downloading', icon: '↓' },
  { label: 'Seeding', command: 'watch ul', status: 'seeding', icon: '↑' },
  { label: 'Completed', command: 'find done', status: 'completed', icon: '✓' },
  { label: 'Paused', command: 'jobs -s', status: 'paused', icon: 'Ⅱ' },
  { label: 'Errors', command: 'tail err', status: 'error', icon: '!' },
];

export function Sidebar() {
  const { filterStatus, setFilterStatus, sidebarCollapsed } = useUIStore();
  const { data: torrents } = useTorrents();
  const list = torrents || [];
  const totalDown = list.reduce((sum: number, torrent: Torrent) => sum + (torrent.downloadSpeed || 0), 0);
  const totalUp = list.reduce((sum: number, torrent: Torrent) => sum + (torrent.uploadSpeed || 0), 0);

  const countForStatus = (status: FilterStatus) => {
    if (status === 'all') return list.length;
    if (status === 'completed') return list.filter((torrent: Torrent) => torrent.status === 'seeding' || torrent.progress >= 1).length;
    return list.filter((torrent: Torrent) => torrent.status === status).length;
  };

  return (
    <aside className={cn('terminal-sidebar', sidebarCollapsed && 'is-collapsed')}>
      <div className="brand-block">
        <div className="brand-glyph">a</div>
        {!sidebarCollapsed && <div><strong>aTORRENT</strong><small>operator console</small></div>}
      </div>
      {!sidebarCollapsed && <div className="session-label"><span>SESSION</span><b>ACTIVE</b></div>}
      <nav className="terminal-nav">
        {!sidebarCollapsed && <p className="nav-heading">~/transfers</p>}
        {navItems.map((item) => {
          const active = filterStatus === item.status;
          return (
            <button key={item.status} onClick={() => setFilterStatus(item.status)} className={active ? 'active' : ''} title={item.label}>
              <span className="nav-icon">{item.icon}</span>
              {!sidebarCollapsed && <><span className="nav-copy"><b>{item.label}</b><small>$ {item.command}</small></span><span className="nav-count">{String(countForStatus(item.status)).padStart(2, '0')}</span></>}
            </button>
          );
        })}
      </nav>
      <div className="sidebar-traffic">
        {!sidebarCollapsed && <p className="nav-heading">NETWORK I/O</p>}
        <div><span>↓</span>{!sidebarCollapsed && <small>DOWNLINK</small>}<b>{formatSpeed(totalDown)}</b></div>
        <div><span>↑</span>{!sidebarCollapsed && <small>UPLINK</small>}<b>{formatSpeed(totalUp)}</b></div>
      </div>
      {!sidebarCollapsed && <div className="sidebar-foot"><span>daemon</span><b>● online</b></div>}
    </aside>
  );
}
