import { cn } from '../../lib/cn.js';
import { useUIStore } from '../../stores/uiStore.js';
import { useTorrents } from '../../hooks/useTorrents.js';
import { formatSpeed } from '../../lib/formatters.js';
import type { FilterStatus, Torrent } from '../../types/index.js';

const navItems: { label: string; status: FilterStatus; icon: string }[] = [
  { label: 'Dashboard', status: 'all', icon: '◈' },
  { label: 'Downloading', status: 'downloading', icon: '↓' },
  { label: 'Seeding', status: 'seeding', icon: '↑' },
  { label: 'Completed', status: 'completed', icon: '✓' },
  { label: 'Paused', status: 'paused', icon: '‖' },
  { label: 'Errors', status: 'error', icon: '!' },
];

export function Sidebar() {
  const { filterStatus, setFilterStatus, sidebarCollapsed } = useUIStore();
  const { data: torrents } = useTorrents();

  const totalDown = (torrents || []).reduce((s: number, t: Torrent) => s + (t.downloadSpeed || 0), 0);
  const totalUp = (torrents || []).reduce((s: number, t: Torrent) => s + (t.uploadSpeed || 0), 0);

  const countForStatus = (status: FilterStatus) => {
    if (!torrents) return 0;
    if (status === 'all') return torrents.length;
    if (status === 'completed') return torrents.filter((t: Torrent) => t.status === 'seeding' || t.progress >= 1).length;
    return torrents.filter((t: Torrent) => t.status === status).length;
  };

  return (
    <aside className={cn(
      'glass h-full flex flex-col border-r border-white/[0.06] transition-all duration-300',
      sidebarCollapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-indigo to-accent-pink flex items-center justify-center font-bold text-sm">
          a
        </div>
        {!sidebarCollapsed && <span className="font-semibold text-lg gradient-text">aTorrent</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {navItems.map(item => {
          const count = countForStatus(item.status);
          const active = filterStatus === item.status;
          return (
            <button
              key={item.status}
              onClick={() => setFilterStatus(item.status)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                active ? 'glass-active text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/[0.03]'
              )}
            >
              <span className="w-5 text-center font-mono">{item.icon}</span>
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {count > 0 && (
                    <span className="text-xs text-white/30 font-mono">{count}</span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Speeds */}
      <div className="p-4 border-t border-white/[0.06]">
        {!sidebarCollapsed ? (
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between text-blue-400">
              <span>↓ DL</span>
              <span>{formatSpeed(totalDown)}</span>
            </div>
            <div className="flex justify-between text-purple-400">
              <span>↑ UL</span>
              <span>{formatSpeed(totalUp)}</span>
            </div>
          </div>
        ) : (
          <div className="text-xs font-mono text-center space-y-1">
            <div className="text-blue-400">↓</div>
            <div className="text-purple-400">↑</div>
          </div>
        )}
      </div>
    </aside>
  );
}
