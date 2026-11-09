import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Rotating role line for the hero. One role at a time, swapped with
 * a smooth vertical blur-fade: the outgoing word rises out
 * (y -8px, blur 4px, fade) and the next one rises in from below
 * (y +8px, blur 4px, fade), 0.35s each on the site's expo-out ease.
 *
 * Crossfade, not fade-out-then-in (Tier 4): the old AnimatePresence
 * mode="wait" ran exit THEN enter, so the box sat empty for ~0.5s
 * every 3s — the role text visibly blanked for a beat (measured
 * live: opacity ~0 for 400-500ms per swap). Now the outgoing word
 * stays mounted as an absolutely-positioned layer inside the same
 * fixed-width box while the incoming word fades in beneath it, so
 * the line is never empty. The incoming word stays in flow, so the
 * box keeps its height and the caret after it never moves.
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
 * ~2.65s between swaps (3.0s cycle minus the 0.35s crossfade).
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
  /* The word being faded out (null when no swap is in flight).
     Kept as state (not derived from `index`) so it survives the
     tick that advances `index` — the outgoing word must stay
     mounted for its 0.35s exit. Cleared by onAnimationComplete
     on the exiting span. A tick can never overlap an exit: the
     interval is 3s, the exit is 0.35s. */
  const [prevIndex, setPrevIndex] = useState(null);
  const indexRef = useRef(0);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      const prev = indexRef.current;
      const next = (prev + 1) % roles.length;
      indexRef.current = next;
      setPrevIndex(prev);
      setIndex(next);
    }, 3000);
    return () => window.clearInterval(id);
  }, [reduceMotion, roles, roles.length]);

  if (reduceMotion) {
    return <span>{roles[0]}</span>;
  }

  return (
    <>
      <span className="sr-only">{roles.join(', ')}</span>
      {/* Fixed-width box (longest role = 18ch, font-mono so ch is
          exact): the caret after it never moves, whatever the role.
          `relative` so the exiting word can overlay the incoming
          one in the same box (crossfade, never a blank frame). */}
      <span aria-hidden="true" className="relative inline-block min-w-[18ch] text-left">
        {prevIndex !== null && (
          <motion.span
            key={`prev-${prevIndex}`}
            className="absolute inset-0 inline-block whitespace-nowrap"
            initial={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            animate={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={SWAP}
            onAnimationComplete={() => setPrevIndex(null)}
          >
            {roles[prevIndex]}
          </motion.span>
        )}
        <motion.span
          key={index}
          className="inline-block whitespace-nowrap"
          initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={SWAP}
        >
          {roles[index]}
        </motion.span>
      </span>
      <span aria-hidden="true" className="text-accent/70 motion-safe:animate-pulse">
        ▏
      </span>
    </>
  );
}
