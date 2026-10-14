import { useTorrents } from '../../hooks/useTorrents.js';
import { useSpeedStore } from '../../hooks/useSpeedHistory.js';
import { usePreferencesStore } from '../../stores/preferencesStore.js';
import { SpeedValue, useSmoothed } from '../ui/AnimatedNumber.js';
import { SpeedGraph } from './SpeedGraph.js';
import { Icon, type IconName } from '../ui/Icon.js';
import { formatBytes, formatSpeed } from '../../lib/formatters.js';
import type { Torrent } from '../../types/index.js';

function Rate({ label, icon, color, bytes, peak, big }: { label: string; icon: IconName; color: string; bytes: number; peak: number; big?: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-[0.12em] text-white/40">
        <span className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: `${color}22`, color }}>
            <Icon name={icon} size={12} strokeWidth={2.6} />
          </span>
          {label}
        </span>
        <span className="normal-case tracking-normal text-[10px] text-white/25 num max-md:hidden">peak {formatSpeed(peak)}</span>
      </div>
      <div
        className={`mt-1.5 font-semibold tracking-tight leading-none ${big ? 'text-[42px] max-md:text-[30px]' : 'text-[26px] max-md:text-[24px]'}`}
        style={{ textShadow: `0 0 36px ${color}55` }}
      >
        <SpeedValue bytesPerSec={bytes} />
      </div>
    </div>
  );
}

function Tile({ label, value, sub, className = '' }: { label: string; value: string; sub?: string; className?: string }) {
  return (
    <div className={`bg-base-50/70 px-3.5 py-2.5 max-md:px-3 ${className}`}>
      <div className="text-[10px] uppercase tracking-[0.12em] text-white/30 truncate">{label}</div>
      <div className="mt-0.5 text-[17px] max-md:text-base font-semibold num tracking-tight truncate">{value}</div>
      {sub && <div className="text-[11px] text-white/30 num truncate max-md:hidden">{sub}</div>}
    </div>
  );
}

export function StatsCards() {
  const { data: torrents } = useTorrents();
  const points = useSpeedStore((s) => s.points);
  const showGraph = usePreferencesStore((s) => s.showSpeedGraph);
  const list: Torrent[] = torrents || [];

  const last = points[points.length - 1];
  const peakDl = Math.max(0, ...points.map((p) => p.dl));
  const peakUl = Math.max(0, ...points.map((p) => p.ul));

  const downloading = list.filter((t) => t.status === 'downloading').length;
  const seeding = list.filter((t) => t.status === 'seeding').length;
  const peers = list.reduce((s, t) => s + (t.numPeers || 0), 0);
  const down = list.reduce((s, t) => s + (t.downloaded || 0), 0);
  const up = list.reduce((s, t) => s + (t.uploaded || 0), 0);
  const total = list.reduce((s, t) => s + (t.totalSize || 0), 0);
  const ratio = down > 0 ? up / down : 0;

  const smoothPeers = Math.round(useSmoothed(peers, 0.5));
  const smoothRatio = useSmoothed(ratio, 0.8);

  return (
    <section className="glass rounded-2xl overflow-hidden">
      <div className={`grid ${showGraph ? 'grid-cols-[minmax(240px,300px)_1fr]' : 'grid-cols-1'} max-md:grid-cols-1`}>
        <div className="p-5 flex md:flex-col md:justify-center gap-5 max-md:gap-4 max-md:px-4 max-md:py-4">
          <div className="max-md:flex-1"><Rate label="Download" icon="arrowDown" color="#38bdf8" bytes={last.dl} peak={peakDl} big /></div>
          <div className="max-md:flex-1"><Rate label="Upload" icon="arrowUp" color="#a78bfa" bytes={last.ul} peak={peakUl} /></div>
        </div>
        {showGraph && (
          <div className="relative px-1 pt-4 pb-0 max-md:px-0 border-l border-white/[0.06] max-md:border-l-0 max-md:border-t">
            <SpeedGraph />
          </div>
        )}
      </div>
      <div className="grid grid-cols-4 md:grid-cols-5 gap-px bg-white/[0.06] border-t border-white/[0.06]">
        <Tile label="Active" value={String(downloading)} sub="downloading" />
        <Tile label="Seeding" value={String(seeding)} sub="uploading" />
        <Tile label="Peers" value={String(smoothPeers)} sub="connected" />
        <Tile label="Ratio" value={smoothRatio.toFixed(2)} sub={`${formatBytes(up)} sent`} />
        <Tile label="Library" value={formatBytes(total)} sub={`${list.length} item${list.length === 1 ? '' : 's'}`} className="max-md:hidden" />
      </div>
    </section>
  );
}
