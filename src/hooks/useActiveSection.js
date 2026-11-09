import { useEffect, useRef, useState } from 'react';
import { NAV_OFFSET_PX } from '../utils/navOffset';

/* Scroll-spy tolerance (P1 fix, 2026-11-10): the scroll landing —
   scroll-margin-top = NAV_OFFSET_PX, honoured identically by native
   fragment jumps, Lenis scrollTo (it subtracts the element's
   scroll-margin-top) and the restore hook — sits EXACTLY on the
   comparison boundary below. A sub-pixel excess (fractional rects,
   a rounded scroll offset) then makes the target section fail the
   test, and the hash stays one section behind until the next
   scroll — because nothing re-runs the spy once the scroll has
   settled. Sections are hundreds of px apart, so 1px can never
   mis-assign; it only absorbs the knife-edge at the landing. */
const SPY_TOLERANCE_PX = 1;

/**
 * Scroll spy aligned with nav order. Works with lazy-mounted sections: we
 * recompute when <main> gains nodes (Suspense) and on scroll/resize.
 *
 * It also keeps the URL in sync with the section in view: the nav icon
 * already follows the scroll, the address bar should too. Clicking a nav
 * icon sets the hash natively (plain `#id` anchors); scrolling only
 * changed the icon until now, so the URL stayed stuck on the last
 * clicked section. This uses `history.replaceState` — never `pushState`
 * — so scrolling never spams the browser history: Back still leaves
 * the page instead of stepping through sections. The home section
 * clears the hash for a clean homepage URL.
 */
export function useActiveSection(sectionIds, options = {}) {
  const offset = options.offset ?? NAV_OFFSET_PX;
  const [activeId, setActiveId] = useState(sectionIds[0] ?? '');
  /* Set after the first real measurement, so a deep-linked load (e.g.
     opening #contact) never briefly syncs the wrong hash while lazy
     sections are still mounting. */
  const computedRef = useRef(false);
  /* State twin of computedRef: the hash-sync effect below must run
     once after the FIRST measurement even when activeId never
     changes from its initial value ('hero'). Without this, a reload
     that lands mid-page (scrollY where no section top has crossed
     the offset line) leaves the URL hash stale at whatever the
     navigation had — e.g. #projects while About is on screen —
     because the effect only re-runs on an activeId change, and
     there was none. The stale hash then feeds the next reload's
     fragment jump with the wrong section. */
  const [hasComputed, setHasComputed] = useState(false);

  useEffect(() => {
    let raf = 0;

    const compute = () => {
      let current = sectionIds[0] ?? '';

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= offset + SPY_TOLERANCE_PX) current = id;
      }

      const lastId = sectionIds[sectionIds.length - 1];
      const lastEl = lastId ? document.getElementById(lastId) : null;
      if (lastEl) {
        const doc = document.documentElement;
        const scrollable = doc.scrollHeight > window.innerHeight + 8;
        const nearBottom =
          scrollable && window.scrollY + window.innerHeight >= doc.scrollHeight - 4;

        if (nearBottom) {
          current = lastId;
        }
      }

      /* First real measurement — flip the state twin so the
         hash-sync effect below runs once even when activeId
         never changes from its initial value. Guarded by the
         ref so setState fires exactly once, not on every
         scroll-driven compute. */
      if (!computedRef.current) {
        computedRef.current = true;
        setHasComputed(true);
      }
      setActiveId((prev) => (prev === current ? prev : current));
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };

    const main = document.querySelector('main');

    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    const mo =
      main &&
      new MutationObserver(() => {
        schedule();
      });
    if (main) mo.observe(main, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      mo?.disconnect();
    };
  }, [sectionIds, offset]);

  /* Sync the address bar with the section in view. replaceState does
     not fire hashchange/scroll events and adds no history entry, so
     this can never fight with anchor clicks or the initial page load.
     hasComputed is a dependency on purpose: the effect must run once
     after the FIRST measurement even when activeId never changed
     from its initial value — otherwise a reload landing mid-page
     leaves a stale hash in the URL (see hasComputed above). */
  useEffect(() => {
    if (!hasComputed || !activeId) return;
    const homeId = sectionIds[0] ?? '';
    const nextHash = activeId === homeId ? '' : `#${activeId}`;
    if (window.location.hash === nextHash) return;
    const url = nextHash || window.location.pathname + window.location.search;
    window.history.replaceState(null, '', url);
  }, [activeId, sectionIds, hasComputed]);

  return activeId;
}
