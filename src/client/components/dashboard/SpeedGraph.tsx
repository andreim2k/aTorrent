import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useSpeedHistory } from '../../hooks/useSpeedHistory.js';
import { formatSpeed } from '../../lib/formatters.js';
import { GlassCard } from '../ui/GlassCard.js';

export function SpeedGraph() {
  const history = useSpeedHistory();

  if (history.length < 2) {
    return (
      <GlassCard className="p-4 h-48 flex items-center justify-center text-white/20 text-sm">
        Speed graph will appear when transfers are active
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4">
      <h3 className="text-xs text-white/40 mb-2 font-medium">Transfer Speed</h3>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={history}>
          <defs>
            <linearGradient id="dlGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="ulGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" hide />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: 'rgba(15,15,25,0.9)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '11px',
              backdropFilter: 'blur(12px)',
            }}
            formatter={(value: number, name: string) => [
              formatSpeed(value),
              name === 'download' ? '↓ Download' : '↑ Upload',
            ]}
            labelFormatter={() => ''}
          />
          <Area type="monotone" dataKey="download" stroke="#3b82f6" fill="url(#dlGrad)" strokeWidth={1.5} />
          <Area type="monotone" dataKey="upload" stroke="#a855f7" fill="url(#ulGrad)" strokeWidth={1.5} />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
