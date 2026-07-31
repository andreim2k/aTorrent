import { AreaChart, Area, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSpeedHistory } from '../../hooks/useSpeedHistory.js';
import { formatSpeed } from '../../lib/formatters.js';

export function SpeedGraph() {
  const history = useSpeedHistory();

  return (
    <section className="holo-panel">
      <div className="holo-panel__bar">
        <div className="holo-panel__id">
          <span className="holo-panel__index">NET·01</span>
          <h2 className="holo-panel__title">Transfer Telemetry</h2>
        </div>
        <div className="holo-panel__meta">
          <span className="holo-legend">
            <span className="holo-legend__key">
              <i className="holo-legend__swatch" style={{ background: 'var(--cy)' }} />
              <span className="holo-label">Down</span>
            </span>
            <span className="holo-legend__key">
              <i className="holo-legend__swatch" style={{ background: 'var(--ion)' }} />
              <span className="holo-label">Up</span>
            </span>
          </span>
          <span className="holo-live">
            <i className="holo-live__dot" />
            <span className="holo-label">Live</span>
          </span>
        </div>
      </div>

      <div className="holo-chart">
        {history.length < 2 ? (
          <div className="holo-chart__empty">
            <div className="holo-empty__mark">◠</div>
            <span className="holo-label">Awaiting telemetry</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="holoDown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38e6ff" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#38e6ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="holoUp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c9bff" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#7c9bff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(150,195,235,.09)" strokeDasharray="2 6" />
              <Tooltip
                wrapperClassName="holo-tooltip"
                contentStyle={{ background: 'transparent', border: 0, boxShadow: 'none', padding: '8px 10px' }}
                itemStyle={{ color: 'var(--text)' }}
                cursor={{ stroke: 'rgba(56,230,255,.35)', strokeWidth: 1 }}
                formatter={(value: number, name: string) => [formatSpeed(value), name === 'download' ? 'DOWN' : 'UP']}
                labelFormatter={() => ''}
              />
              <Area type="monotone" dataKey="download" stroke="#38e6ff" fill="url(#holoDown)" strokeWidth={1.6} isAnimationActive={false} />
              <Area type="monotone" dataKey="upload" stroke="#7c9bff" fill="url(#holoUp)" strokeWidth={1.6} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
