import { useState, useEffect, useCallback } from 'react';

/**
 * Manages dark ↔ light theme.
 *
 * - Reads the initial state from the DOM `data-theme` attribute
 *   (set by the inline <head> script, so there's no flash).
 * - Persists to localStorage.
 * - Falls back to `prefers-color-scheme` if nothing is stored.
 * - Uses the View Transitions API for a circular reveal when toggling
 *   (with a simple fallback for older browsers).
 */
export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.getAttribute('data-theme') || 'dark';
    }
    return 'dark';
  });

  const applyTheme = useCallback((next) => {
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setThemeState(next);
  }, []);

  const toggle = useCallback(
    (event) => {
      const next = theme === 'dark' ? 'light' : 'dark';

      /* Capture the toggle button position so the CSS circular reveal
         originates from the button the user clicked. */
      if (event?.currentTarget) {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
        const y = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
        document.documentElement.style.setProperty('--toggle-x', `${x}%`);
        document.documentElement.style.setProperty('--toggle-y', `${y}%`);
      }

      /* View Transitions API → smooth circular clip-path reveal.
         Falls back to an instant swap if unsupported or if the user
         prefers reduced motion. */
      const prefersReduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;

      if (document.startViewTransition && !prefersReduced) {
        document.startViewTransition(() => applyTheme(next));
      } else {
        applyTheme(next);
      }
    },
    [theme, applyTheme],
  );

  /* Re-sync if the system preference changes and the user hasn't
     stored an explicit choice. */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = (e) => {
      if (!localStorage.getItem('theme')) {
        applyTheme(e.matches ? 'light' : 'dark');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [applyTheme]);

  return { theme, toggle, isDark: theme === 'dark' };
}
