import { cn } from '../../lib/cn.js';

const statusColors: Record<string, { bg: string; text: string; glow: string }> = {
  downloading: { bg: 'bg-blue-500/20', text: 'text-blue-400', glow: 'glow-blue' },
  seeding: { bg: 'bg-green-500/20', text: 'text-green-400', glow: 'glow-green' },
  paused: { bg: 'bg-amber-500/20', text: 'text-amber-400', glow: 'glow-amber' },
  error: { bg: 'bg-red-500/20', text: 'text-red-400', glow: 'glow-red' },
  queued: { bg: 'bg-white/10', text: 'text-white/60', glow: '' },
  checking: { bg: 'bg-purple-500/20', text: 'text-purple-400', glow: '' },
};

interface Props {
  status: string;
  className?: string;
}

export function GlowBadge({ status, className }: Props) {
  const colors = statusColors[status] || statusColors.queued;
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      colors.bg, colors.text, colors.glow,
      className
    )}>
      {status}
    </span>
  );
}
