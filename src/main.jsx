import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

/* Self-hosted variable fonts — latin subset, weight axis only.
   Replaces the render-blocking Google Fonts stylesheet. */
import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/plus-jakarta-sans/wght.css';

import './index.css';
import App from './App.jsx';

/* Scroll restoration is manual — see useScrollRestore. The
   browser's own restore fires while the lazy sections are still
   unmounted (the document is just the hero), so it clamps the
   saved offset to the short page and the user lands on the wrong
   section. Setting this before React renders stops the browser
   from restoring at all; the hook restores the position itself
   once the layout settles. */
try {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }
} catch {
  /* History API unavailable — the hook still restores. */
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
