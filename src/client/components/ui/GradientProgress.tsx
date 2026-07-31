import { cn } from '../../lib/cn.js';

interface Props { progress: number; className?: string; }

/** Transfer completion meter. Gains a travelling highlight while FX is engaged. */
export function GradientProgress({ progress, className }: Props) {
  const percent = Math.min(1, Math.max(0, progress)) * 100;
  return (
    <div
      className={cn('holo-meter', className)}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span className="holo-meter__fill" style={{ width: `${percent}%` }} />
    </div>
  );
}
