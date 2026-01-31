import { cn } from '../../lib/cn.js';
import { motion, HTMLMotionProps } from 'framer-motion';

interface Props extends HTMLMotionProps<'div'> {
  hover?: boolean;
}

export function GlassCard({ className, hover = false, children, ...props }: Props) {
  return (
    <motion.div
      className={cn(
        'glass rounded-xl',
        hover && 'glass-hover cursor-pointer transition-all duration-200',
        className
      )}
      whileHover={hover ? { y: -2, scale: 1.005 } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
}
