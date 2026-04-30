import { useEffect, useState } from 'react';

export function useActiveSection(sectionIds, options = {}) {
  const { rootMargin = '-45% 0px -45% 0px', threshold = 0 } = options;
  const [activeId, setActiveId] = useState(sectionIds[0] ?? '');

  useEffect(() => {
    const observers = [];
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    elements.forEach((el) => {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveId(entry.target.id);
            }
          });
        },
        { rootMargin, threshold }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [sectionIds, rootMargin, threshold]);

  return activeId;
}
