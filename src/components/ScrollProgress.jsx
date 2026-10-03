import { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

/**
 * A thin accent-coloured progress bar fixed to the very top
 * of the viewport. Shows how far the user has scrolled.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

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
