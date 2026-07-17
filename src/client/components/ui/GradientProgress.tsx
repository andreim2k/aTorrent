import { cn } from '../../lib/cn.js';
interface Props { progress: number; className?: string; }
export function GradientProgress({ progress, className }: Props) {
  const percent = Math.min(1, Math.max(0, progress)) * 100;
  return <div className={cn('terminal-progress', className)}><span style={{ width: `${percent}%` }} /><i style={{ left: `${Math.min(percent, 98)}%` }} /></div>;
}
