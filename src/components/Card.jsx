import { motion } from 'framer-motion';

export function Card({ className = '', children, highlight = false, ...motionProps }) {
  const base =
    'rounded-xl border border-white/[0.08] bg-white/[0.03] shadow-glass backdrop-blur-xl transition-all duration-300 ease-out sm:rounded-2xl';
  const glow = highlight
    ? 'ring-1 ring-accent/25 shadow-accent-glow'
    : 'hover:border-accent/20 hover:shadow-glass-hover';

  return (
    <motion.div
      className={`${base} ${glow} ${className}`}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.25 }}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
