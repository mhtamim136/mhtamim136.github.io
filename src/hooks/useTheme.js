import { useState, useCallback } from 'react';

/**
 * Manages dark ↔ light theme.
 *
 * - Reads the initial state from the DOM `data-theme` attribute
 *   (set by the inline <head> script, so there's no flash).
 * - Persists to localStorage.
 * - Default is dark. The OS `prefers-color-scheme` is deliberately
 *   NOT listened to: the inline script stores the resolved theme on
 *   first load, so only an explicit toggle changes the theme.
 *   (Previously an OS-change listener flipped a first-time visitor's
 *   theme whenever the OS theme changed — that is why the site opened
 *   light in one browser and dark in another.)
 * - Keeps the `theme-color` meta in sync with the active theme, so
 *   the browser chrome matches the site instead of the OS.
 * - Uses the View Transitions API for a circular reveal when toggling
 *   (with a simple fallback for older browsers).
 */
const THEME_COLORS = {
  dark: '#0a0e13',
  light: '#f5f7fa',
};

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.getAttribute('data-theme') || 'dark';
    }
    return 'dark';
  });

  const applyTheme = useCallback((next) => {
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* Storage unavailable — theme still applies for this visit. */
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLORS[next]);
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

  return { theme, toggle, isDark: theme === 'dark' };
}
