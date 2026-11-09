import js from '@eslint/js';
import globals from 'globals';

export default [
  // Base recommended rules for every JS file. This is what catches
  // the audit's dead-code class: no-unused-vars, no-unreachable,
  // no-undef. (No eslint-plugin-react: 7.37.x caps its eslint peer
  // range at ^9.7, so it cannot install cleanly beside eslint 10.
  // React-specific rules like jsx-key are the accepted gap — the
  // core rules below are the ones that matter here.)
  js.configs.recommended,

  // React app code: browser globals + JSX parsing.
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.es2022 },
    },
  },

  // Serverless functions, build scripts, Vite plugins, root configs:
  // Node globals, no JSX.
  {
    files: ['api/**/*.js', 'scripts/**/*.mjs', 'plugins/**/*.js', '*.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.es2022 },
    },
  },

  {
    ignores: ['dist/**', 'node_modules/**', 'public/_hero/**'],
  },
];
