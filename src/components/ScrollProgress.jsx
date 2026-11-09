import { useEffect, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';

/**
 * A thin accent-coloured progress bar fixed to the very top
 * of the viewport. Shows how far the user has scrolled.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const reduceMotion = useReducedMotion() ?? false;
  /* The spring is created unconditionally (hooks cannot be
     conditional) — under reduced motion the bar reads the raw
     scroll progress directly, so it tracks the scroll exactly
     instead of lagging behind it. The spring is a physics
     animation, so MotionConfig does not gate it. */
  const spring = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });
  const scaleX = reduceMotion ? scrollYProgress : spring;

  /* Only render after first scroll to avoid a flash on load */
  const [hasScrolled, setHasScrolled] = useState(false);
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (v) => {
      if (v > 0.005) setHasScrolled(true);
    });
    return unsubscribe;
  }, [scrollYProgress]);

  if (!hasScrolled) return null;

  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-accent"
      style={{ scaleX }}
      aria-hidden
    />
  );
}
