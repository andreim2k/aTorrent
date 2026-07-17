import { cn } from '../../lib/cn.js';
interface Props { status: string; className?: string; }
export function GlowBadge({ status, className }: Props) {
  return <span className={cn('terminal-badge', `badge-${status}`, className)}><i />{status.toUpperCase()}</span>;
}
