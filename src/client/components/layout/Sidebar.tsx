import { useUIStore } from '../../stores/uiStore.js';
import { useTorrents } from '../../hooks/useTorrents.js';
import { formatSpeed } from '../../lib/formatters.js';
import type { FilterStatus, Torrent } from '../../types/index.js';

const navItems: { label: string; status: FilterStatus; glyph: string }[] = [
  { label: 'All transfers', status: 'all', glyph: '◈' },
  { label: 'Downloading', status: 'downloading', glyph: '↓' },
  { label: 'Seeding', status: 'seeding', glyph: '↑' },
  { label: 'Completed', status: 'completed', glyph: '✓' },
  { label: 'Paused', status: 'paused', glyph: '‖' },
  { label: 'Errors', status: 'error', glyph: '!' },
];

export function Sidebar() {
  const { filterStatus, setFilterStatus, sidebarCollapsed, dismissRailIfOverlay } = useUIStore();
  const { data: torrents } = useTorrents();
  const list = torrents || [];
  const totalDown = list.reduce((sum: number, t: Torrent) => sum + (t.downloadSpeed || 0), 0);
  const totalUp = list.reduce((sum: number, t: Torrent) => sum + (t.uploadSpeed || 0), 0);

  const countFor = (status: FilterStatus) => {
    if (status === 'all') return list.length;
    if (status === 'completed') return list.filter((t: Torrent) => t.status === 'seeding' || t.progress >= 1).length;
    return list.filter((t: Torrent) => t.status === status).length;
  };

  return (
    <aside className="holo-rail">
      <div className="holo-brand">
        <div className="holo-mark">a</div>
        {!sidebarCollapsed && (
          <div>
            <strong className="holo-brand__name">aTORRENT</strong>
            <span className="holo-brand__sub holo-label">Command Console</span>
          </div>
        )}
      </div>

      {!sidebarCollapsed && <div className="holo-rail__section holo-label">Transfers</div>}

      <nav className="holo-nav">
        {navItems.map((item) => {
          const active = filterStatus === item.status;
          return (
            <button
              key={item.status}
              type="button"
              onClick={() => { setFilterStatus(item.status); dismissRailIfOverlay(); }}
              className={`holo-nav__item ${active ? 'is-active' : ''}`}
              title={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <span className="holo-nav__glyph">{item.glyph}</span>
              {!sidebarCollapsed && (
                <>
                  <span className="holo-nav__text">{item.label}</span>
                  <span className="holo-nav__count">{String(countFor(item.status)).padStart(2, '0')}</span>
                </>
              )}
            </button>
          );
        })}
      </nav>

      <div className="holo-io">
        {!sidebarCollapsed && <span className="holo-label">Network I/O</span>}
        <div className="holo-io__row holo-io--down">
          <span className="holo-io__arrow">↓</span>
          {!sidebarCollapsed && <span className="holo-label">Downlink</span>}
          <span className="holo-io__val">{formatSpeed(totalDown)}</span>
        </div>
        <div className="holo-io__row holo-io--up">
          <span className="holo-io__arrow">↑</span>
          {!sidebarCollapsed && <span className="holo-label">Uplink</span>}
          <span className="holo-io__val">{formatSpeed(totalUp)}</span>
        </div>
      </div>
    </aside>
  );
}
