import { motion } from 'framer-motion';
import { cn } from '../../lib/cn.js';
import { useUIStore } from '../../stores/uiStore.js';
import { useTorrents, useSystemInfo } from '../../hooks/useTorrents.js';
import { formatBytes } from '../../lib/formatters.js';
import { Logo } from '../ui/Logo.js';
import { Icon, type IconName } from '../ui/Icon.js';
import type { FilterStatus, Torrent } from '../../types/index.js';

const navItems: { label: string; status: FilterStatus; icon: IconName; tint: string }[] = [
  { label: 'Library', status: 'all', icon: 'layers', tint: '#a5b4fc' },
  { label: 'Downloading', status: 'downloading', icon: 'download', tint: '#38bdf8' },
  { label: 'Seeding', status: 'seeding', icon: 'upload', tint: '#34d399' },
  { label: 'Completed', status: 'completed', icon: 'check', tint: '#a3e635' },
  { label: 'Paused', status: 'paused', icon: 'pause', tint: '#fbbf24' },
  { label: 'Errors', status: 'error', icon: 'alert', tint: '#fb7185' },
];

function Meter({ label, icon, percent, detail, warn }: { label: string; icon: IconName; percent: number; detail: string; warn?: boolean }) {
  const p = Math.min(100, Math.max(0, percent));
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1.5">
        <span className="flex items-center gap-1.5 text-white/45"><Icon name={icon} size={12} />{label}</span>
        <span className="text-white/60 num">{detail}</span>
      </div>
      <div className="h-1 rounded-full bg-white/[0.07] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: warn ? 'linear-gradient(90deg,#fbbf24,#fb7185)' : 'linear-gradient(90deg,#38bdf8,#818cf8)' }}
          initial={{ width: 0 }}
          animate={{ width: `${p}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export function Sidebar() {
  const { filterStatus, setFilterStatus, sidebarCollapsed } = useUIStore();
  const { data: torrents } = useTorrents();
  const { data: system } = useSystemInfo();
  const list: Torrent[] = torrents || [];
  const collapsed = sidebarCollapsed;

  const countFor = (status: FilterStatus) => {
    if (status === 'all') return list.length;
    if (status === 'completed') return list.filter((t) => t.status === 'seeding' || t.progress >= 1).length;
    return list.filter((t) => t.status === status).length;
  };

  const disk = system?.disk?.[0];
  const mem = system?.memory;

  return (
    <aside
      className={cn(
        'glass h-full rounded-2xl flex flex-col transition-[width] duration-300 ease-out overflow-hidden',
        collapsed ? 'w-[68px] max-md:w-[260px]' : 'w-[248px]'
      )}
    >
      {/* Brand */}
      <div className={cn('flex items-center gap-3 px-4 pt-5 pb-4', collapsed && 'md:justify-center md:px-0')}>
        <Logo />
        <div className={cn('leading-tight', collapsed && 'md:hidden')}>
          <div className="font-semibold text-[17px] tracking-tight">a<span className="gradient-text">Torrent</span></div>
          <div className="text-[10px] text-white/30 tracking-[0.14em] uppercase">Media engine</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-1 space-y-0.5 overflow-y-auto">
        <div className={cn('px-3 pb-1.5 pt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white/25', collapsed && 'md:hidden')}>Browse</div>
        {navItems.map((item) => {
          const count = countFor(item.status);
          const active = filterStatus === item.status;
          return (
            <button
              key={item.status}
              onClick={() => {
                setFilterStatus(item.status);
                if (window.innerWidth < 768) useUIStore.getState().toggleSidebar();
              }}
              title={item.label}
              className={cn(
                'relative w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-colors duration-150 group',
                collapsed && 'md:justify-center md:px-0',
                active ? 'text-white' : 'text-white/50 hover:text-white/85 hover:bg-white/[0.04]'
              )}
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl bg-white/[0.07] ring-1 ring-inset ring-white/[0.09]"
                  transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                />
              )}
              {active && (
                <motion.div
                  layoutId="nav-bar"
                  className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
                  style={{ background: item.tint, boxShadow: `0 0 12px ${item.tint}` }}
                  transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                />
              )}
              <span className="relative flex-shrink-0 transition-colors" style={{ color: active ? item.tint : undefined }}>
                <Icon name={item.icon} size={17} />
              </span>
              <span className={cn('relative flex-1 text-left', collapsed && 'md:hidden')}>{item.label}</span>
              {count > 0 && (
                <span
                  className={cn(
                    'relative text-[11px] num px-1.5 py-0.5 rounded-md min-w-[22px] text-center',
                    collapsed && 'md:hidden',
                    item.status === 'error' ? 'bg-rose-400/15 text-rose-300' : active ? 'bg-white/10 text-white/80' : 'text-white/35'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System health */}
      <div className={cn('p-3 m-2.5 rounded-xl bg-black/20 border border-white/[0.05] space-y-3', collapsed && 'md:hidden')}>
        {disk ? (
          <Meter
            label="Disk"
            icon="drive"
            percent={disk.usePercent}
            detail={`${formatBytes(disk.available, 0)} free`}
            warn={disk.usePercent > 90}
          />
        ) : (
          <div className="text-[11px] text-white/30">System stats unavailable</div>
        )}
        {mem && <Meter label="Memory" icon="cpu" percent={mem.usePercent} detail={`${Math.round(mem.usePercent)}%`} warn={mem.usePercent > 90} />}
        {system?.cpu && <Meter label="CPU" icon="zap" percent={system.cpu.loadPercent} detail={`${Math.round(system.cpu.loadPercent)}%`} warn={system.cpu.loadPercent > 90} />}
      </div>
    </aside>
  );
}
