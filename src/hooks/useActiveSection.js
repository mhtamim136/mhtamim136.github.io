import { useEffect, useState } from 'react';

/**
 * Scroll spy aligned with nav order. Works with lazy-mounted sections: we
 * recompute when <main> gains nodes (Suspense) and on scroll/resize.
 */
export function useActiveSection(sectionIds, options = {}) {
  const offset = options.offset ?? 96;
  const [activeId, setActiveId] = useState(sectionIds[0] ?? '');

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

  return activeId;
}
