import { useTorrents } from '../../hooks/useTorrents.js';
import { formatSpeed } from '../../lib/formatters.js';
import type { Torrent } from '../../types/index.js';

export function StatsCards() {
  const { data: torrents } = useTorrents();
  const list = torrents || [];
  const totalDown = list.reduce((sum: number, torrent: Torrent) => sum + (torrent.downloadSpeed || 0), 0);
  const totalUp = list.reduce((sum: number, torrent: Torrent) => sum + (torrent.uploadSpeed || 0), 0);
  const downloading = list.filter((torrent: Torrent) => torrent.status === 'downloading').length;
  const seeding = list.filter((torrent: Torrent) => torrent.status === 'seeding').length;
  const stats = [
    { index: '01', label: 'DOWNLINK', value: formatSpeed(totalDown), meta: `${downloading} active`, tone: 'cyan', glyph: '↓' },
    { index: '02', label: 'UPLINK', value: formatSpeed(totalUp), meta: `${seeding} seeding`, tone: 'violet', glyph: '↑' },
    { index: '03', label: 'ACTIVE JOBS', value: String(downloading).padStart(2, '0'), meta: `${list.length} total`, tone: 'accent', glyph: '◆' },
    { index: '04', label: 'SEED NODES', value: String(seeding).padStart(2, '0'), meta: 'network healthy', tone: 'green', glyph: '●' },
  ];

  return (
    <section className="metric-grid">
      {stats.map((stat) => (
        <article className={`metric-card tone-${stat.tone}`} key={stat.label}>
          <div className="metric-head"><span>{stat.index}</span><b>{stat.label}</b><i>{stat.glyph}</i></div>
          <strong>{stat.value}</strong>
          <div className="metric-foot"><span>{stat.meta}</span><b>▰▰▰▱▱</b></div>
        </article>
      ))}
    </section>
  );
}
