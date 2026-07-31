import { cn } from '../../lib/cn.js';

interface Props { status: string; className?: string; }

export function GlowBadge({ status, className }: Props) {
  return (
    <span className={cn('holo-badge', `is-${status}`, className)}>
      <i aria-hidden="true" />
      {status}
    </span>
  );
}
