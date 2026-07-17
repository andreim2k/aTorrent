import { cn } from '../../lib/cn.js';
import { motion, HTMLMotionProps } from 'framer-motion';
interface Props extends HTMLMotionProps<'div'> { hover?: boolean; }
export function GlassCard({ className, hover = false, children, ...props }: Props) {
  return <motion.div className={cn('terminal-card', hover && 'terminal-card-hover', className)} {...props}>{children}</motion.div>;
}
