import { useEffect, useRef, useState } from 'react';

/**
 * Hide-on-scroll for the navbar: hide while scrolling down, show
 * again on ANY scroll up, always visible at the very top.
 *
 * Transform only (the Navbar applies a translateY) — layout is
 * never touched, so hiding the bar cannot shift page content.
 *
 * ── Why hysteresis, not a plain lastY comparison ──
 * A naive "hide if scrollY > lastY" flickers: trackpad inertia
 * and slow scrolling produce tiny direction flips that would
 * toggle the bar on and off. A naive dead zone on the per-frame
 * delta has the opposite bug — scrolling down slowly in 2px
 * steps never accumulates past the dead zone, so the bar never
 * hides at all.
 *
 * Instead we track an anchor: the furthest scrollY reached in
 * the current direction. While shown, the anchor is the highest
 * point seen; the bar hides only once the user has moved
 * `deadZone` px DOWN from that anchor (and past `hideAfter`).
 * While hidden, the anchor is the deepest point seen; the bar
 * shows again once the user has moved `deadZone` px UP from it.
 * Small jitter (< deadZone) never flips state, but sustained
 * slow scrolling always accumulates past the dead zone — and any
 * real scroll up, however small the total distance, shows the bar.
 *
 * ── Reduced motion ──
 * The hook itself does not gate on prefers-reduced-motion: the
 * site's global reduced-motion rule (index.css) already collapses
 * every transition to 0.01ms, so under reduced motion the bar
 * still hides/shows — instantly, with no slide. That is the
 * cleaner option: the feature is preserved, the motion is gone.
 * (Verified in the reduced-motion CDP run: no intermediate
 * transform values, the bar jumps straight to its end state.)
 *
 * @param {number} hideAfter — don't hide until the page is this
 *   far down (keeps the bar put while the user is still at the
 *   hero top; default 80px).
 * @param {number} deadZone — px of movement in one direction
 *   needed to flip state (jitter guard; default 6px).
 * @returns {boolean} true while the navbar should be hidden.
 */
export function useHideOnScroll({ hideAfter = 80, deadZone = 6 } = {}) {
  const [hidden, setHidden] = useState(false);
  /* Mirror of `hidden` for the scroll handler, so the handler
     never reads stale state and never needs an impure updater. */
  const hiddenRef = useRef(false);

  useEffect(() => {
    /* Furthest scrollY reached in the current direction — the
       anchor the dead zone is measured against. */
    let anchorY = window.scrollY;
    let raf = 0;

    const set = (next) => {
      if (hiddenRef.current === next) return;
      hiddenRef.current = next;
      setHidden(next);
    };

    const update = () => {
      raf = 0;
      const y = window.scrollY;

      /* At the very top the bar is always visible. */
      if (y <= 0) {
        anchorY = 0;
        set(false);
        return;
      }

      if (hiddenRef.current) {
        /* Hidden: track the deepest point; show on any real
           upward move from it. */
        anchorY = Math.max(anchorY, y);
        if (y < anchorY - deadZone) set(false);
      } else {
        /* Shown: track the highest point; hide on a real
           downward move past the threshold. */
        anchorY = Math.min(anchorY, y);
        if (y > anchorY + deadZone && y > hideAfter) set(true);
      }
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [hideAfter, deadZone]);

  return hidden;
}
