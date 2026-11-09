import { useEffect } from 'react';
import Lenis from 'lenis';
import { setLenis, setLenisRafKick } from '../utils/smoothScroll';
import { useMediaQuery } from './useMediaQuery';

/**
 * Lenis smooth scroll, gated hard on prefers-reduced-motion.
 *
 * The instance is created ONLY when the user has no reduced-motion
 * preference. Lenis also ships its own `respectReducedMotion`
 * (default true, lerp forced to 1), but this site gates motion
 * off entirely instead of degrading it — same rule as every other
 * effect here (BlurWords, Magnetic, Card tilt, Spotlight): under
 * reduced motion Lenis must not exist at all, so scrolling stays
 * native and instant. The gate is the shared useMediaQuery hook,
 * so a live change of the OS setting destroys or creates the
 * instance to match (the effect below re-runs on the boolean).
 *
 * Anchor clicks (`#id` links in the nav, hero and footer) are
 * routed through Lenis instead of the browser's native jump:
 * Lenis's built-in `anchors` option does not preventDefault, so
 * the native jump would race its animation. Here the click is
 * prevented, Lenis scrolls (it honours the section's
 * `scroll-margin-top`, so the landing matches the native one),
 * and the hash is set with pushState — a clicked nav link is a
 * real navigation, and the scroll-spy's replaceState then keeps
 * it without adding history entries while scrolling.
 *
 * Exception — the skip link (`#main`): it is NOT routed through
 * Lenis. A skip link is not a navigation — it must jump instantly
 * and move keyboard focus into <main> (App's skipToContent), and
 * pushState would add a history entry for it. Letting the browser
 * handle it natively does all three; every other anchor still
 * goes through Lenis.
 *
 * When Lenis is off the handler is inert: nothing is prevented
 * and native anchors behave exactly as before.
 *
 * The rAF loop is DEMAND-DRIVEN (P8), not Lenis's `autoRaf`:
 * autoRaf runs a permanent requestAnimationFrame loop even on an
 * idle page. Here the loop runs only while a smooth animation is
 * in flight and stops the moment it settles, so an idle page runs
 * zero rAF. Lenis reports its state as a tri-state `isScrolling`
 * (false | "native" | "smooth"); only "smooth" — a wheel lerp or
 * a programmatic scrollTo — needs frames from us. Touch scrolling
 * is native here (syncTouch is off), and the scrollbar / keyboard
 * path moves the viewport by itself, so neither needs the loop.
 * The loop is woken by (1) a wheel event, (2) an anchor click
 * below, and (3) smoothScrollTo (via setLenisRafKick) — every
 * path that can start an animation. The scroll-restore hook needs
 * no kick: it scrolls with `{ immediate: true }`, which sets the
 * position synchronously and starts no animation.
 */
export function useLenis() {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    if (prefersReducedMotion) return undefined;

    let lenis = null;

    /* One frame of the demand loop: advance Lenis, then re-arm
       only while an animation is still in flight. */
    let rafId = null;
    const loop = (time) => {
      if (!lenis) {
        rafId = null;
        return;
      }
      lenis.raf(time);
      if (lenis.isScrolling === 'smooth') {
        rafId = requestAnimationFrame(loop);
      } else {
        rafId = null;
      }
    };

    const kick = () => {
      if (rafId !== null || !lenis) return;
      /* Reset Lenis's frame clock before the first scheduled frame:
         after idle, lenis.time is stale and the next raf() would see
         a multi-second deltaTime — the lerp damper
         (1 - exp(-λ·dt)) would snap the scroll straight to its
         target instead of gliding. Writing the clock directly
         advances nothing: no animation is running while the loop
         is idle (it only stops once isScrolling settles), it only
         makes the first frame's delta ~0ms, exactly like a fresh
         instance (whose time starts undefined). */
      lenis.time = performance.now();
      rafId = requestAnimationFrame(loop);
    };

    const start = () => {
      if (lenis) return;
      lenis = new Lenis({ autoRaf: false, lerp: 0.1 });
      setLenis(lenis);
      setLenisRafKick(kick);
      window.addEventListener('wheel', kick, { passive: true });
    };

    const stop = () => {
      if (!lenis) return;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      window.removeEventListener('wheel', kick);
      setLenisRafKick(null);
      lenis.destroy();
      lenis = null;
      setLenis(null);
    };

    const onClick = (e) => {
      if (!lenis) return;
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      const hash = anchor.getAttribute('href');
      if (!hash || hash.length < 2) return;
      /* Skip link: native handling (see header) — instant jump +
         focus into <main>, no Lenis, no history entry. */
      if (hash === '#main') return;
      if (!document.querySelector(hash)) return;
      e.preventDefault();
      lenis.scrollTo(hash);
      kick();
      window.history.pushState(null, '', hash);
    };

    document.addEventListener('click', onClick);
    start();

    return () => {
      document.removeEventListener('click', onClick);
      stop();
    };
  }, [prefersReducedMotion]);
}
