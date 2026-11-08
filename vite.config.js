import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import heroImagePlugin from './plugins/vite-plugin-hero-image.js';
import fontPreloadPlugin from './plugins/vite-plugin-font-preload.js';

export default defineConfig({
  plugins: [heroImagePlugin(), react(), fontPreloadPlugin()],
});
