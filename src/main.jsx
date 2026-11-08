import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

/* Self-hosted variable fonts — latin subset, weight axis only.
   Replaces the render-blocking Google Fonts stylesheet. */
import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/plus-jakarta-sans/wght.css';

import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
