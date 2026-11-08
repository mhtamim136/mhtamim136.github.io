import { useRef, useCallback } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';

/**
 * Card with a subtle 3D tilt on hover.
 *
 * The tilt is lightweight (max ±4°), uses spring physics,
 * and is purely decorative — it has no effect on mobile
 * (hover doesn't fire on touch devices).
 */
export function Card({
  className = '',
  children,
  highlight = false,
  /* Opt-in per-card spotlight (project cards only): a soft radial
     light that follows the pointer inside the card. Other cards
     (Skills, Services, Experience) never get it. */
  spotlight = false,
  ...motionProps
}) {
  const ref = useRef(null);
  /* prefers-reduced-motion: motion values driven by useSpring /
     useMotionValue BYPASS <MotionConfig reducedMotion="user">, so the
     tilt needs its own gate — otherwise the card keeps tilting for
     users who asked for reduced motion. */
  const reduceMotion = useReducedMotion();
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [4, -4]), {
    stiffness: 250,
    damping: 25,
  });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-4, 4]), {
    stiffness: 250,
    damping: 25,
  });

  const handleMouseMove = useCallback(
    (e) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      /* Reduced motion: never move the tilt values off neutral. The
         spotlight position writes below still run — the spotlight
         itself is hidden under reduced motion by the CSS rule. */
      if (!reduceMotion) {
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        mouseX.set(x);
        mouseY.set(y);
      }
      /* Spotlight position for the ::before radial gradient.
         Style writes only — no layout work. */
      if (spotlight) {
        el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        el.style.setProperty('--my', `${e.clientY - rect.top}px`);
      }
    },
    [mouseX, mouseY, spotlight, reduceMotion],
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }, [mouseX, mouseY]);

  const base =
    'relative rounded-xl border border-card bg-card shadow-glass backdrop-blur-xl transition-[border-color,box-shadow] duration-300 ease-out sm:rounded-2xl';
  const glow = highlight
    ? 'ring-1 ring-accent/25 shadow-accent-glow'
    : /* Border steps up one notch on hover (white 8% → 12% dark,
         slate 10% → 12% light); the shadow adds the soft
         accent-tinted lift. No new colour is introduced. */
      'hover:border-[var(--card-border-hover)] hover:shadow-glass-hover';

  return (
    <motion.div
      ref={ref}
      className={`${base} ${glow} ${spotlight ? 'card-spotlight' : ''} ${className}`}
      style={{
        rotateX: reduceMotion ? 0 : rotateX,
        rotateY: reduceMotion ? 0 : rotateY,
        transformPerspective: 800,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
