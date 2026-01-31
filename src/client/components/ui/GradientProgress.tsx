import { cn } from '../../lib/cn.js';

interface Props {
  progress: number; // 0-1
  className?: string;
}

export function GradientProgress({ progress, className }: Props) {
  const pct = Math.min(1, Math.max(0, progress)) * 100;

  // Gradient shifts blue→green with completion
  const hue = 210 + progress * 90; // 210 (blue) → 140 (green-ish) — interpolated via gradient stops

  return (
    <div className={cn('relative h-1.5 rounded-full bg-white/5 overflow-hidden', className)}>
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, #3b82f6, ${progress > 0.5 ? '#22c55e' : '#6366f1'})`,
        }}
      />
      {/* Glow underneath */}
      <div
        className="absolute inset-y-0 left-0 rounded-full blur-sm opacity-50"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, #3b82f6, ${progress > 0.5 ? '#22c55e' : '#6366f1'})`,
        }}
      />
    </div>
  );
}
