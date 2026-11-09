import { useEffect, useRef, useState } from 'react';
import { NAV_OFFSET_PX } from '../utils/navOffset';

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

  useEffect(() => {
    let raf = 0;

    const compute = () => {
      let current = sectionIds[0] ?? '';

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= offset) current = id;
      }

      const lastId = sectionIds[sectionIds.length - 1];
      const lastEl = lastId ? document.getElementById(lastId) : null;
      if (lastEl) {
        const doc = document.documentElement;
        const scrollable = doc.scrollHeight > window.innerHeight + 8;
        const nearBottom =
          scrollable &&
          window.scrollY + window.innerHeight >= doc.scrollHeight - 4;

        if (nearBottom) {
          current = lastId;
        }
      }

      computedRef.current = true;
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
     this can never fight with anchor clicks or the initial page load. */
  useEffect(() => {
    if (!computedRef.current || !activeId) return;
    const homeId = sectionIds[0] ?? '';
    const nextHash = activeId === homeId ? '' : `#${activeId}`;
    if (window.location.hash === nextHash) return;
    const url = nextHash || window.location.pathname + window.location.search;
    window.history.replaceState(null, '', url);
  }, [activeId, sectionIds]);

  return activeId;
}
