import { useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * Card with a subtle 3D tilt on hover.
 *
 * The tilt is lightweight (max ±4°), uses spring physics,
 * and is purely decorative — it has no effect on mobile
 * (hover doesn't fire on touch devices).
 */
export function Card({ className = '', children, highlight = false, ...motionProps }) {
  const ref = useRef(null);
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
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    },
    [mouseX, mouseY],
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }, [mouseX, mouseY]);

  const base =
    'rounded-xl border border-card bg-card shadow-glass backdrop-blur-xl transition-[border-color,box-shadow] duration-300 ease-out sm:rounded-2xl';
  const glow = highlight
    ? 'ring-1 ring-accent/25 shadow-accent-glow'
    : 'hover:border-accent/20 hover:shadow-glass-hover';

  return (
    <motion.div
      ref={ref}
      className={`${base} ${glow} ${className}`}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
