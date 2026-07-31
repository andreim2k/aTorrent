import { useTorrents } from '../../hooks/useTorrents.js';
import { formatSpeed } from '../../lib/formatters.js';
import type { Torrent } from '../../types/index.js';

const LOAD_SEGMENTS = 5;

/** Discrete load readout — the tile's data-lattice detail, driven by real ratios. */
function LoadBars({ filled }: { filled: number }) {
  return (
    <span className="holo-metric__bars" aria-hidden="true">
      {Array.from({ length: LOAD_SEGMENTS }, (_, i) => (
        <i key={i} className={i < filled ? 'is-on' : ''} />
      ))}
    </span>
  );
}

export function StatsCards() {
  const { data: torrents } = useTorrents();
  const list = torrents || [];
  const totalDown = list.reduce((sum: number, t: Torrent) => sum + (t.downloadSpeed || 0), 0);
  const totalUp = list.reduce((sum: number, t: Torrent) => sum + (t.uploadSpeed || 0), 0);
  const downloading = list.filter((t: Torrent) => t.status === 'downloading').length;
  const seeding = list.filter((t: Torrent) => t.status === 'seeding').length;
  const peers = list.reduce((sum: number, t: Torrent) => sum + (t.numPeers || 0), 0);

  // Load segments scale against a soft reference so the bars stay meaningful.
  const seg = (value: number, ceiling: number) =>
    Math.max(0, Math.min(LOAD_SEGMENTS, Math.round((value / ceiling) * LOAD_SEGMENTS)));

  const metrics = [
    {
      id: 'downlink', label: 'Downlink', tone: 'tone-cy', glyph: '↓',
      value: formatSpeed(totalDown), meta: `${downloading} active`, filled: seg(totalDown, 5e6),
    },
    {
      id: 'uplink', label: 'Uplink', tone: 'tone-ion', glyph: '↑',
      value: formatSpeed(totalUp), meta: `${seeding} seeding`, filled: seg(totalUp, 2e6),
    },
    {
      id: 'jobs', label: 'Active jobs', tone: 'tone-flux', glyph: '◈',
      value: String(downloading).padStart(2, '0'), meta: `${list.length} queued`, filled: seg(downloading, Math.max(list.length, 1)),
    },
    {
      id: 'peers', label: 'Peer mesh', tone: 'tone-warn', glyph: '⬡',
      value: String(peers).padStart(2, '0'), meta: peers > 0 ? 'mesh healthy' : 'no peers', filled: seg(peers, 60),
    },
  ];

  return (
    <section className="holo-metrics" aria-label="Transfer metrics">
      {metrics.map((metric) => (
        <article className={`holo-metric ${metric.tone}`} key={metric.id}>
          <div className="holo-metric__head">
            <span className="holo-label">{metric.label}</span>
            <span className="holo-metric__glyph" aria-hidden="true">{metric.glyph}</span>
          </div>
          <strong className="holo-metric__value">{metric.value}</strong>
          <div className="holo-metric__foot">
            <span className="holo-label">{metric.meta}</span>
            <LoadBars filled={metric.filled} />
          </div>
        </article>
      ))}
    </section>
  );
}
