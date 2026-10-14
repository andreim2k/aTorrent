import { cn } from '../../lib/cn.js';
import { getStatus } from '../../lib/status.js';

interface Props {
  status: string;
  className?: string;
}

/** Status pill: a colored dot (pulsing while downloading) plus a label. */
export function GlowBadge({ status, className }: Props) {
  const meta = getStatus(status);
  const live = status === 'downloading';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ring-inset',
        meta.bg, meta.text, meta.ring, className
      )}
    >
      <span className="relative flex w-1.5 h-1.5">
        {live && <span className="absolute inset-0 rounded-full animate-ping-slow" style={{ background: meta.color }} />}
        <span className="relative w-1.5 h-1.5 rounded-full" style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}` }} />
      </span>
      {meta.label}
    </span>
  );
}
