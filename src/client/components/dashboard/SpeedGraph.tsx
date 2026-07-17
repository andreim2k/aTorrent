import { AreaChart, Area, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSpeedHistory } from '../../hooks/useSpeedHistory.js';
import { formatSpeed } from '../../lib/formatters.js';

export function SpeedGraph() {
  const history = useSpeedHistory();
  return (
    <section className="terminal-panel traffic-panel">
      <div className="panel-titlebar">
        <div><span className="panel-index">[ NET.01 ]</span><strong>TRANSFER TELEMETRY</strong><small>REAL-TIME / 1S</small></div>
        <div className="legend"><span className="down">■ DOWN</span><span className="up">■ UP</span><b>LIVE ●</b></div>
      </div>
      <div className="chart-wrap">
        {history.length < 2 ? (
          <div className="chart-empty"><span>~</span><p>awaiting transfer telemetry<span className="cursor-block" /></p></div>
        ) : (
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="dlGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--cyan)" stopOpacity={0.3} /><stop offset="100%" stopColor="var(--cyan)" stopOpacity={0} /></linearGradient>
                <linearGradient id="ulGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--violet)" stopOpacity={0.25} /><stop offset="100%" stopColor="var(--violet)" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border-faint)" strokeDasharray="2 5" />
              <Tooltip contentStyle={{ background: 'var(--panel-solid)', border: '1px solid var(--border)', borderRadius: 0, fontSize: 11, color: 'var(--text)' }} formatter={(value: number, name: string) => [formatSpeed(value), name === 'download' ? 'DOWN' : 'UP']} labelFormatter={() => ''} />
              <Area type="monotone" dataKey="download" stroke="var(--cyan)" fill="url(#dlGrad)" strokeWidth={1.5} isAnimationActive={false} />
              <Area type="monotone" dataKey="upload" stroke="var(--violet)" fill="url(#ulGrad)" strokeWidth={1.5} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
