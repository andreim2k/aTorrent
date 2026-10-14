import { motion } from 'framer-motion';

interface Props {
  checked: boolean;
  onToggle: (e: React.MouseEvent) => void;
}

export function SelectCheckbox({ checked, onToggle }: Props) {
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      whileTap={{ scale: 0.8 }}
      animate={{ scale: checked ? [1, 1.25, 1] : 1 }}
      transition={{ duration: 0.25 }}
      className={`relative w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-200 ${
        checked
          ? 'bg-gradient-to-br from-accent-indigo to-accent-purple border-transparent shadow-[0_0_14px_rgba(99,102,241,0.65)]'
          : 'bg-white/[0.04] border-white/20 hover:border-accent-indigo/60 hover:bg-white/[0.08]'
      }`}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <motion.path
          d="M5 12.5l4.5 4.5L19 7.5"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        />
      </svg>
    </motion.button>
  );
}
