import { useEffect, useState } from 'react';

export function useScrollTop(threshold = 400) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    /* rAF-throttled like useHideOnScroll / useActiveSection: the
       scroll handler only schedules one measurement per frame
       instead of running setVisible on every scroll event. */
    let raf = 0;
    const update = () => {
      raf = 0;
      setVisible(window.scrollY > threshold);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [threshold]);

  return visible;
}
