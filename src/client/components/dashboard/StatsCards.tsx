import { useTorrents } from '../../hooks/useTorrents.js';
import { GlassCard } from '../ui/GlassCard.js';
import { formatBytes, formatSpeed } from '../../lib/formatters.js';
import type { Torrent } from '../../types/index.js';

export function StatsCards() {
  const { data: torrents } = useTorrents();
  const list = torrents || [];

  const totalDown = list.reduce((s: number, t: Torrent) => s + (t.downloadSpeed || 0), 0);
  const totalUp = list.reduce((s: number, t: Torrent) => s + (t.uploadSpeed || 0), 0);
  const downloading = list.filter((t: Torrent) => t.status === 'downloading').length;
  const seeding = list.filter((t: Torrent) => t.status === 'seeding').length;

  const stats = [
    { label: 'Download', value: formatSpeed(totalDown), color: 'text-blue-400' },
    { label: 'Upload', value: formatSpeed(totalUp), color: 'text-purple-400' },
    { label: 'Downloading', value: String(downloading), color: 'text-blue-400' },
    { label: 'Seeding', value: String(seeding), color: 'text-green-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {stats.map(s => (
        <GlassCard key={s.label} className="p-3">
          <div className="text-xs text-white/40 mb-1">{s.label}</div>
          <div className={`text-lg font-mono font-semibold ${s.color}`}>{s.value}</div>
        </GlassCard>
      ))}
    </div>
  );
}
