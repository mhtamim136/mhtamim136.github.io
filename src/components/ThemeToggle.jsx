import { motion, AnimatePresence } from 'framer-motion';

const iconVariants = {
  initial: { opacity: 0, rotate: -90, scale: 0 },
  animate: { opacity: 1, rotate: 0, scale: 1 },
  exit: { opacity: 0, rotate: 90, scale: 0 },
};

const transition = { duration: 0.3, ease: [0.22, 1, 0.36, 1] };

/**
 * Animated sun ↔ moon toggle.
 * Uses AnimatePresence for a smooth rotate-crossfade between icons.
 */
export function ThemeToggle({ isDark, onToggle }) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-glass/10 bg-glass/[0.04] text-muted transition-colors duration-300 hover:border-accent/25 hover:bg-glass/[0.07] hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:h-11 sm:w-11"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      whileHover={{ scale: 1.07, y: -2 }}
      whileTap={{ scale: 0.93 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.svg
          key={isDark ? 'moon' : 'sun'}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={iconVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transition}
        >
          {isDark ? (
            /* Moon */
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          ) : (
            /* Sun with rays */
            <>
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </>
          )}
        </motion.svg>
      </AnimatePresence>
    </motion.button>
  );
}
