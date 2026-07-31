import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  index?: string;
  wide?: boolean;
  /** Drop body padding/scroll so the child manages its own layout (split panes). */
  flushBody?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/** The console's modal surface: framed glass with corner brackets. */
export function GlassModal({ open, onClose, title, index = 'DLG', wide, flushBody, footer, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="holo-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className="holo-modal-wrap">
            <motion.div
              className={`holo-modal ${wide ? 'holo-modal--wide' : ''}`}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              initial={{ opacity: 0, scale: 0.97, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 14 }}
              transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="holo-modal__head">
                <span className="holo-panel__index">{index}</span>
                <h2 className="holo-modal__title">{title}</h2>
                <button className="holo-icon-btn" onClick={onClose} aria-label="Close dialog">×</button>
              </div>
              <div className={`holo-modal__body ${flushBody ? 'holo-modal__body--flush' : ''}`}>{children}</div>
              {footer && <div className="holo-modal__foot">{footer}</div>}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
