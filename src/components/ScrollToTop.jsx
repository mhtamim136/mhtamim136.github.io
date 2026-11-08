import { motion, AnimatePresence } from 'framer-motion';
import { NavIcon } from './icons/NavIcons';
import { useScrollTop } from '../hooks/useScrollTop';

export function ScrollToTop() {
  const visible = useScrollTop(480);

  /* An explicit behavior overrides the CSS `scroll-behavior: auto`
     under prefers-reduced-motion, so check the preference here —
     same pattern as ProjectsSection's handleShowLess. */
  const scrollUp = () => {
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.9, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 8 }}
          transition={{ duration: 0.25 }}
          onClick={scrollUp}
          className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-xl border border-accent/25  bg-surface-elevated/90 text-accent shadow-glass backdrop-blur-md transition hover:border-accent/45 hover:shadow-glass-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:bottom-8 sm:right-8"
          aria-label="Back to top"
        >
          <NavIcon name="arrow-up" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
