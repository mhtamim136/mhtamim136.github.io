import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

/**
 * Rotating role line for the hero. One role at a time, 0.4s fade, new
 * role every 3s. The line keeps a fixed minimum height, so the swap
 * never moves the content below it (no layout shift).
 *
 * - prefers-reduced-motion: the first role, shown statically.
 * - Hidden tab: the timer skips ticks instead of racing through roles.
 * - Screen readers get the full list once, the animation is hidden.
 */
const ROLES = ['Software Developer', 'React Developer', 'Java Developer', 'C# Developer'];

export function RoleLine({ roles = ROLES }) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setIndex((i) => (i + 1) % roles.length);
    }, 3000);
    return () => window.clearInterval(id);
  }, [reduceMotion, roles.length]);

  if (reduceMotion) {
    return <span>{roles[0]}</span>;
  }

  return (
    <>
      <span className="sr-only">{roles.join(', ')}</span>
      <span aria-hidden="true">
        <AnimatePresence mode="wait">
          <motion.span
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {roles[index]}
          </motion.span>
        </AnimatePresence>
      </span>
      <span aria-hidden="true" className="text-accent/70 motion-safe:animate-pulse">
        ▏
      </span>
    </>
  );
}
