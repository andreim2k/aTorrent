import { cn } from '../../lib/cn.js';

interface Props {
  progress: number; // 0-1
  status?: string;
  className?: string;
}

const fills: Record<string, string> = {
  downloading: 'linear-gradient(90deg, #38bdf8, #6366f1)',
  seeding: 'linear-gradient(90deg, #34d399, #2dd4bf)',
  paused: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
  error: 'linear-gradient(90deg, #fb7185, #f43f5e)',
};

export function GradientProgress({ progress, status = 'downloading', className }: Props) {
  const pct = Math.min(1, Math.max(0, progress)) * 100;
  const fill = fills[status] ?? 'linear-gradient(90deg, #94a3b8, #64748b)';
  return (
    <div className={cn('relative h-1.5 rounded-full bg-white/[0.07] overflow-hidden', className)}>
      <div className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out overflow-hidden" style={{ width: `${pct}%`, background: fill }}>
        {status === 'downloading' && pct > 0 && pct < 100 && (
          <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-sheen" />
        )}
      </div>
    </div>
  );
}
