import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { NavIcon } from './icons/NavIcons';
import { useScrollTop } from '../hooks/useScrollTop';
import { smoothScrollTo } from '../utils/smoothScroll';

export function ScrollToTop() {
  const visible = useScrollTop(480);
  const reduceMotion = useReducedMotion() ?? false;
  const [footerInView, setFooterInView] = useState(false);

  /* Hide while the footer is on screen: the fixed button sits on
     the footer's bottom bar on mobile and covers the end of the
     copyright line ("…All rights reserve[d]"). Any intersection
     hides it; scrolling back up brings it back. The existing
     mount/exit animation is untouched — only the condition gains
     a second term. */
  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => setFooterInView(entry.isIntersecting), {
      threshold: 0,
    });
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  /* Routes through Lenis when it is active, native smooth scroll
     otherwise (instant under reduced motion — same check the
     helper applies on the fallback path). */
  const scrollUp = () => {
    smoothScrollTo(0);
  };

  return (
    <AnimatePresence>
      {visible && !footerInView && (
        <motion.button
          type="button"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.9, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={
            reduceMotion
              ? { opacity: 0, transition: { duration: 0 } }
              : { opacity: 0, scale: 0.9, y: 8 }
          }
          transition={{ duration: 0.25 }}
          onClick={scrollUp}
          className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-xl border border-accent/25  bg-surface-elevated/90 text-accent shadow-glass backdrop-blur-md transition-colors hover:border-accent/45 hover:shadow-glass-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:bottom-8 sm:right-8"
          aria-label="Back to top"
        >
          <NavIcon name="arrow-up" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
