import { useEffect, useRef } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';

/**
 * Cursor-following spotlight — one soft light that trails the pointer
 * across the page.
 *
 * - Fixed 600px radial-gradient disc, positioned with transform only
 *   (no layout work), eased toward the pointer by a single rAF loop
 *   that runs only while the light is still catching up.
 * - Fades in on first pointer move, out when the pointer leaves the
 *   window. The native cursor is untouched — this is a light, not a
 *   cursor replacement.
 * - Inert unless the device has a fine pointer (mouse/trackpad) and
 *   the user has NOT asked for reduced motion. Both are re-checked
 *   live, so toggling the OS setting takes effect without a reload.
 * - Colour/strength come from --spotlight in index.css, so each
 *   theme tunes it (light mode needs a deeper tint to read on the
 *   bright surface).
 */
const SIZE = 600;
const HALF = SIZE / 2;

export function Spotlight() {
  const ref = useRef(null);
  /* Gate on fine pointer + no reduced-motion preference (live —
     toggling the OS setting takes effect without a reload). */
  const finePointer = useMediaQuery('(pointer: fine)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const enabled = finePointer && !reducedMotion;

  /* Chase loop — transform-only, stops when settled. */
  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let running = false;
    let placed = false;
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight * 0.3;
    let cx = tx;
    let cy = ty;

    const step = () => {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      el.style.transform = `translate3d(${cx - HALF}px, ${cy - HALF}px, 0)`;
      if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) {
        raf = requestAnimationFrame(step);
      } else {
        running = false;
      }
    };
    const kick = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(step);
      }
    };
    const onMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      /* Snap to the pointer on first move so the light never fades
         in at its start position and then glides across the page. */
      if (!placed) {
        placed = true;
        cx = tx;
        cy = ty;
        el.style.transform = `translate3d(${cx - HALF}px, ${cy - HALF}px, 0)`;
      }
      el.style.opacity = '1';
      kick();
    };
    const onLeave = () => {
      el.style.opacity = '0';
    };

    el.style.opacity = '0';
    window.addEventListener('mousemove', onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;
  return <div ref={ref} className="spotlight" aria-hidden="true" />;
}
