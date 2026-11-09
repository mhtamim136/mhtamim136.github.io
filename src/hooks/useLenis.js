import { useEffect } from 'react';
import Lenis from 'lenis';
import { setLenis } from '../utils/smoothScroll';

/**
 * Lenis smooth scroll, gated hard on prefers-reduced-motion.
 *
 * The instance is created ONLY when the user has no reduced-motion
 * preference. Lenis also ships its own `respectReducedMotion`
 * (default true, lerp forced to 1), but this site gates motion
 * off entirely instead of degrading it — same rule as every other
 * effect here (BlurWords, Magnetic, Card tilt, Spotlight): under
 * reduced motion Lenis must not exist at all, so scrolling stays
 * native and instant. A live change of the OS setting destroys
 * or creates the instance to match.
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
 * When Lenis is off the handler is inert: nothing is prevented
 * and native anchors behave exactly as before.
 */
export function useLenis() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    let lenis = null;

    const start = () => {
      if (lenis || mq.matches) return;
      lenis = new Lenis({ autoRaf: true, lerp: 0.1 });
      setLenis(lenis);
    };

    const stop = () => {
      if (!lenis) return;
      lenis.destroy();
      lenis = null;
      setLenis(null);
    };

    const onChange = () => {
      if (mq.matches) stop();
      else start();
    };

    const onClick = (e) => {
      if (!lenis) return;
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      const hash = anchor.getAttribute('href');
      if (!hash || hash.length < 2) return;
      if (!document.querySelector(hash)) return;
      e.preventDefault();
      lenis.scrollTo(hash);
      window.history.pushState(null, '', hash);
    };

    document.addEventListener('click', onClick);
    mq.addEventListener('change', onChange);
    start();

    return () => {
      document.removeEventListener('click', onClick);
      mq.removeEventListener('change', onChange);
      stop();
    };
  }, []);
}
