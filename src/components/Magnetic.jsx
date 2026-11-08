import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/**
 * Magnetic wrapper — primary CTAs only (hero buttons, contact submit).
 *
 * The button leans toward the pointer when it comes near, then springs
 * back when the pointer leaves. Transform only — layout is never
 * touched, and the native cursor is untouched.
 *
 * ── OVERLAP ENGINEERING (the whole point of this component) ──
 * The two hero buttons sit in a `flex flex-wrap gap-4` row, so the
 * real gap between them is 16px (verified by measurement in the
 * verification run). Each button's translation is CAPPED at 5px per
 * axis. The worst case is tighter than the naive "both lean" math,
 * because the hovered button's own hover scale (1.02) ALSO grows it
 * ~2px toward its neighbour while the neighbour leans in:
 *   cursor exactly between the buttons: 5 + 5 = 10px closed, 6px left
 *   cursor on one button's inner edge:  5 (its lean) + 2 (its own
 *   scale growth) + 5 (neighbour leaning in) = 12px closed, 4px left
 * So even in the worst measured case, >= 4px remains between the
 * buttons. Overlap is impossible by construction, not by luck.
 *
 * The cap, not the radius, is what binds: with strength 0.3 the cap
 * binds whenever the cursor is >= 17px from a button's centre
 * (0.3 * 17 ≈ 5), and the trigger radius (120px from centre) is far
 * larger than that. The spring is ~critically damped
 * (stiffness 250 / damping 22 / mass 0.5 → ζ ≈ 0.98), so it cannot
 * overshoot past the cap either — the runtime test also samples the
 * gap continuously while the cursor moves, and the minimum observed
 * distance is reported, so transients are covered too.
 *
 * If the cap ever had to grow, the gap would have to grow first
 * (Tamim's lever 2). It was not needed: a 5px lean is clearly
 * visible, and the hero gap stays at gap-4.
 *
 * ── Gates ──
 * Inert unless the device has a fine pointer (mouse/trackpad) and
 * the user has NOT asked for reduced motion. Both are re-checked
 * live, so toggling the OS setting takes effect without a reload.
 * When disabled, the children render inside a plain wrapper with
 * no listeners and no transform — identical layout, zero motion.
 *
 * ── Press feedback ──
 * Deliberately NOT added here: both wrapped buttons already have
 * it (hero Button: `active:scale-[0.98]`; contact submit:
 * `whileTap={{ scale: 0.98 }}`). Adding another 0.98 on the wrapper
 * would compound to ~0.96 and feel heavier than specified.
 */
const STRENGTH = 0.3;
const RADIUS = 120; // px from the button centre
const CAP = 5; // px per axis — see overlap note above

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export function Magnetic({ children, className = 'inline-block', strength = STRENGTH, radius = RADIUS, cap = CAP }) {
  const ref = useRef(null);
  const [enabled, setEnabled] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 22, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 250, damping: 22, mass: 0.5 });

  /* Gate on fine pointer + no reduced-motion preference. */
  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () =>
      setEnabled(finePointer.matches && !reducedMotion.matches);
    update();
    finePointer.addEventListener('change', update);
    reducedMotion.addEventListener('change', update);
    return () => {
      finePointer.removeEventListener('change', update);
      reducedMotion.removeEventListener('change', update);
    };
  }, []);

  /* Pull toward the pointer while it is inside the radius, spring
     back to zero when it leaves. Motion values only — the spring
     does the smoothing, so no per-frame React state updates. */
  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      if (Math.hypot(dx, dy) < radius) {
        x.set(clamp(dx * strength, -cap, cap));
        y.set(clamp(dy * strength, -cap, cap));
      } else {
        x.set(0);
        y.set(0);
      }
    };
    const onLeave = () => {
      x.set(0);
      y.set(0);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
    };
  }, [enabled, x, y, strength, radius, cap]);

  if (!enabled) return <div className={className}>{children}</div>;
  return (
    <motion.div ref={ref} className={className} style={{ x: sx, y: sy }}>
      {children}
    </motion.div>
  );
}
