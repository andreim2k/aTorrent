import { motion, AnimatePresence } from 'framer-motion';
interface Props { open: boolean; onClose: () => void; title: string; children: React.ReactNode; }
export function GlassModal({ open, onClose, title, children }: Props) {
  return <AnimatePresence>{open && <><motion.div className="terminal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} /><motion.div className="terminal-modal-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div className="terminal-modal" initial={{ scale: 0.98, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.98, y: 12 }} onClick={(event) => event.stopPropagation()}><div className="terminal-modal-head"><span>[ DIALOG ]</span><h2>{title.toUpperCase()}</h2><button onClick={onClose}>ESC ×</button></div><div className="terminal-modal-body">{children}</div></motion.div></motion.div></>}</AnimatePresence>;
}
