import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

const iconVariants = {
  initial: { opacity: 0, rotate: -90, scale: 0 },
  animate: { opacity: 1, rotate: 0, scale: 1 },
  exit: { opacity: 0, rotate: 90, scale: 0 },
};

const transition = { duration: 0.3, ease: [0.22, 1, 0.36, 1] };

/* W30: shared 44px icon-button base — ThemeToggle and the Navbar
   overlay socials had the same shape written twice. Only the
   identical base + focus ring is shared: the hover treatment
   differs per use (toggle: subtle glass; socials: stronger accent
   fill), so each call site adds its own hover classes. */
export const iconButtonClass =
  'flex h-11 w-11 items-center justify-center rounded-xl border border-glass/10 bg-glass/[0.04] text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

/**
 * Animated sun ↔ moon toggle.
 * Uses AnimatePresence for a smooth rotate-crossfade between icons.
 */
export function ThemeToggle({ isDark, onToggle }) {
  /* Reduced motion: the hover/tap gestures are gated below — under
     reduced motion the button must not move. Same pattern as the
     Contact submit button. */
  const reduceMotion = useReducedMotion() ?? false;
  /* No native `title` here: Navbar renders the instant custom tooltip
     for this button — with a title, both would show. */
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      className={`${iconButtonClass} transition-colors duration-300 hover:border-accent/25 hover:bg-glass/[0.07] hover:text-accent`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      whileHover={reduceMotion ? undefined : { scale: 1.07, y: -2 }}
      whileTap={reduceMotion ? undefined : { scale: 0.93 }}
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
          /* Tier 3 — the icon crossfade is an opacity animation, so
             MotionConfig's transform-only gate does not stop it.
             Under reduced motion the swap is instant (duration 0);
             the rotate/scale in the variants are already killed by
             MotionConfig. The button is 44×44 (was 40×40) — a real
             tap target on mobile. */
          transition={reduceMotion ? { duration: 0 } : transition}
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
