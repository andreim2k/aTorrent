import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore, type ToastKind } from '../../stores/toastStore.js';
import { Icon, type IconName } from './Icon.js';

const kinds: Record<ToastKind, { icon: IconName; color: string }> = {
  success: { icon: 'check', color: '#34d399' },
  error: { icon: 'alert', color: '#fb7185' },
  info: { icon: 'info', color: '#818cf8' },
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div className="fixed top-4 right-4 z-[70] flex flex-col gap-2 w-[340px] max-w-[calc(100vw-2rem)] pointer-events-none" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const k = kinds[t.kind];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: 'spring', damping: 26, stiffness: 340 }}
              className="pointer-events-auto glass bg-base-50/90 rounded-xl px-3.5 py-3 flex items-start gap-3 shadow-float relative overflow-hidden"
              role="status"
            >
              <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${k.color}22`, color: k.color }}>
                <Icon name={k.icon} size={14} strokeWidth={2.6} />
              </span>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="text-[13px] font-medium leading-tight">{t.title}</div>
                {t.description && <div className="text-xs text-white/45 mt-0.5 truncate">{t.description}</div>}
              </div>
              <button onClick={() => dismiss(t.id)} className="text-white/30 hover:text-white/80 transition-colors mt-0.5" aria-label="Dismiss">
                <Icon name="x" size={13} />
              </button>
              <motion.div
                className="absolute bottom-0 left-0 h-[2px]"
                style={{ background: k.color }}
                initial={{ width: '100%' }}
                animate={{ width: 0 }}
                transition={{ duration: 4.2, ease: 'linear' }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
