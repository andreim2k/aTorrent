import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon.js';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: string;
  children: React.ReactNode;
}

export function GlassModal({ open, onClose, title, subtitle, width = 'max-w-lg', children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/65 backdrop-blur-md z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className={`glass rounded-2xl w-full ${width} max-h-[88vh] overflow-hidden flex flex-col shadow-float pointer-events-auto bg-base-50/80`}
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            >
              <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
                <div>
                  <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
                  {subtitle && <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 -mr-2 -mt-1 flex items-center justify-center rounded-lg text-white/40 hover:text-white/90 hover:bg-white/[0.08] transition-colors"
                  aria-label="Close"
                >
                  <Icon name="x" size={16} />
                </button>
              </div>
              <div className="px-6 pb-6 overflow-auto">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
