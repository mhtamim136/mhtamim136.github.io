/**
 * vite-plugin-font-preload
 *
 * After Vite bundles the @fontsource-variable woff2 files into dist/assets/,
 * this plugin injects <link rel="preload" as="font"> tags into index.html
 * for the latin-subset woff2 files (the only ones most visitors need).
 *
 * This ensures the browser starts downloading the fonts immediately,
 * without waiting for the CSS to be parsed first.
 */
export default function fontPreloadPlugin() {
  return {
    name: 'vite-plugin-font-preload',
    enforce: 'post',

    transformIndexHtml(html, ctx) {
      if (!ctx.bundle) return [];

      const tags = [];

      for (const [fileName, asset] of Object.entries(ctx.bundle)) {
        // Match only latin (not latin-ext) woff2 files from fontsource
        if (
          asset.type === 'asset' &&
          fileName.endsWith('.woff2') &&
          (fileName.includes('inter-latin-wght-normal') ||
            fileName.includes('plus-jakarta-sans-latin-wght-normal'))
        ) {
          tags.push({
            tag: 'link',
            attrs: {
              rel: 'preload',
              as: 'font',
              type: 'font/woff2',
              crossorigin: '',
              href: `/${fileName}`,
            },
            injectTo: 'head-prepend',
          });
        }
      }

      return tags;
    },
  };
}
