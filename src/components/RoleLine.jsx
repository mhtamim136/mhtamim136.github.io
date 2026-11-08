import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

/**
 * Rotating role line for the hero. One role at a time, swapped with
 * a smooth vertical blur-fade: the outgoing word rises out
 * (y -8px, blur 4px, fade) and the next one rises in from below
 * (y +8px, blur 4px, fade), 0.35s each on the site's expo-out ease.
 * AnimatePresence mode="wait" runs exit then enter, so the two words
 * never overlap and there is no flash — one calm beat per swap.
 *
 * The word sits in a fixed-width box sized to the longest role
 * ('Software Developer', 18 chars). The line is font-mono, so 1ch
 * is exactly one character wide and min-w-[18ch] fits every role
 * with no clipping. The box never changes width, so the blinking
 * caret after it never moves and nothing around the line reflows.
 * The role line's parent <p> already has min-h, so the swap never
 * moves the content below it either.
 *
 * Interval: a new role every 3s; each role is fully visible for
 * ~2.3s between swaps (3.0s cycle minus the 0.7s swap).
 *
 * - prefers-reduced-motion: the first role, shown statically.
 * - Hidden tab: the timer skips ticks instead of racing through roles.
 * - Screen readers get the full list once, the animation is hidden.
 * - No typewriter effect: whole words swap, never one character
 *   at a time.
 */
const ROLES = ['Software Developer', 'React Developer', 'Java Developer', 'C# Developer'];

/* One smooth swap beat — expo-out, the site's existing ease. */
const SWAP = { duration: 0.35, ease: [0.22, 1, 0.36, 1] };

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
      {/* Fixed-width box (longest role = 18ch, font-mono so ch is
          exact): the caret after it never moves, whatever the role. */}
      <span aria-hidden="true" className="inline-block min-w-[18ch] text-left">
        <AnimatePresence mode="wait">
          <motion.span
            key={index}
            className="inline-block"
            initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={SWAP}
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
