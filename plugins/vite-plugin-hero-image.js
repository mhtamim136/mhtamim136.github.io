/**
 * vite-plugin-hero-image
 *
 * Build-time image optimiser for the hero profile photo.
 *
 * What it does:
 *  1. Scans /Image/ for the first image file (png, jpg, jpeg, webp, avif)
 *  2. Generates AVIF + WebP variants at 480 / 800 / 1100 px widths (quality 82)
 *  3. Copies the original as a PNG fallback at the largest width
 *  4. Writes a virtual module `virtual:hero-image-manifest` that the React
 *     <picture> component can import to get all srcset URLs
 *  5. Injects <link rel="preload"> into index.html so the browser discovers
 *     the LCP image from the very first byte of HTML (no JS needed).
 *     The preload uses the AVIF srcset — the same format the <picture>
 *     element picks first — so the preloaded file is actually used.
 *     (Preloading WebP instead caused a "preloaded but not used"
 *     console warning, because AVIF-capable browsers fetch the AVIF.)
 *
 * The original file in /Image/ is NEVER modified.
 */

import { readdir, readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const IMAGE_DIR = 'Image';
const WIDTHS = [480, 800, 1100];
const QUALITY = 82;
const VIRTUAL_ID = 'virtual:hero-image-manifest';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif']);

/**
 * Find the first image in the Image/ directory.
 */
async function findSourceImage(root) {
  const dir = path.join(root, IMAGE_DIR);
  if (!existsSync(dir)) return null;

  /* Sorted, so the pick is deterministic if several images exist. */
  const files = (await readdir(dir)).sort();
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (IMAGE_EXTS.has(ext)) {
      return { name: file, fullPath: path.join(dir, file) };
    }
  }
  return null;
}

/**
 * Generate optimised variants and return the manifest data.
 */
async function generateVariants(sourcePath, outDir, basePath) {
  await mkdir(outDir, { recursive: true });

  const sourceBuffer = await readFile(sourcePath);
  const image = sharp(sourceBuffer);
  const meta = await image.metadata();

  const manifest = {
    originalWidth: meta.width,
    originalHeight: meta.height,
    avif: [],
    webp: [],
    png: null, // single fallback
    sizes: '(min-width: 1280px) 288px, (min-width: 1024px) 256px, (min-width: 640px) 224px, 192px',
  };

  for (const w of WIDTHS) {
    // Don't upscale
    const targetW = Math.min(w, meta.width);

    // AVIF
    const avifName = `hero-${targetW}w.avif`;
    const avifBuf = await sharp(sourceBuffer)
      .resize(targetW, null, { withoutEnlargement: true })
      .avif({ quality: QUALITY, effort: 4 })
      .toBuffer();
    await writeFile(path.join(outDir, avifName), avifBuf);
    manifest.avif.push({
      url: `${basePath}${avifName}`,
      width: targetW,
      size: avifBuf.length,
    });

    // WebP
    const webpName = `hero-${targetW}w.webp`;
    const webpBuf = await sharp(sourceBuffer)
      .resize(targetW, null, { withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer();
    await writeFile(path.join(outDir, webpName), webpBuf);
    manifest.webp.push({
      url: `${basePath}${webpName}`,
      width: targetW,
      size: webpBuf.length,
    });
  }

  // PNG fallback at largest width (for ancient browsers)
  const fallbackW = Math.min(WIDTHS[WIDTHS.length - 1], meta.width);
  const pngName = `hero-${fallbackW}w.png`;
  const pngBuf = await sharp(sourceBuffer)
    .resize(fallbackW, null, { withoutEnlargement: true })
    .png({ compressionLevel: 9 }) // PNG ignores `quality`
    .toBuffer();
  await writeFile(path.join(outDir, pngName), pngBuf);
  manifest.png = {
    url: `${basePath}${pngName}`,
    width: fallbackW,
    size: pngBuf.length,
  };

  return manifest;
}

/**
 * Build the srcset string from a variant array.
 */
function buildSrcset(variants) {
  return variants.map((v) => `${v.url} ${v.width}w`).join(', ');
}

export default function heroImagePlugin() {
  let manifest = null;
  let isDev = false;
  let projectRoot = '';
  let devImageUrl = null;

  return {
    name: 'vite-plugin-hero-image',
    enforce: 'pre',

    configResolved(config) {
      isDev = config.command === 'serve';
      projectRoot = config.root;
    },

    async buildStart() {
      if (isDev) {
        // In dev mode, just find the source image for the virtual module
        const source = await findSourceImage(projectRoot);
        if (source) {
          devImageUrl = `/${IMAGE_DIR}/${source.name}`;
        }
        return;
      }

      // Build mode: generate optimized images
      const source = await findSourceImage(projectRoot);
      const outDir = path.join(projectRoot, 'public', '_hero');
      /* W35: clean previous build artifacts BEFORE the early return
         below — an empty /Image/ used to skip this cleanup, so
         stale variants shipped in the next build. */
      if (existsSync(outDir)) {
        await rm(outDir, { recursive: true });
      }
      if (!source) {
        console.log('[hero-image] No image found in /Image/ — skipping');
        return;
      }

      console.log(`[hero-image] Optimising ${source.name}...`);

      manifest = await generateVariants(source.fullPath, outDir, '/_hero/');

      // Log sizes
      console.log('[hero-image] Generated variants:');
      for (const v of manifest.avif) {
        console.log(`  AVIF ${v.width}w: ${(v.size / 1024).toFixed(1)} KB`);
      }
      for (const v of manifest.webp) {
        console.log(`  WebP ${v.width}w: ${(v.size / 1024).toFixed(1)} KB`);
      }
      console.log(
        `  PNG  ${manifest.png.width}w: ${(manifest.png.size / 1024).toFixed(1)} KB (fallback)`
      );
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },

    load(id) {
      if (id !== RESOLVED_ID) return;

      if (isDev) {
        // Dev mode: return simple single-image manifest
        if (!devImageUrl) {
          return `export default null;`;
        }
        return `export default ${JSON.stringify({
          dev: true,
          src: devImageUrl,
        })};`;
      }

      // Build mode: return full manifest
      if (!manifest) {
        return `export default null;`;
      }

      return `export default ${JSON.stringify({
        dev: false,
        avifSrcset: buildSrcset(manifest.avif),
        webpSrcset: buildSrcset(manifest.webp),
        pngFallback: manifest.png.url,
        sizes: manifest.sizes,
        width: manifest.originalWidth,
        height: manifest.originalHeight,
      })};`;
    },

    transformIndexHtml() {
      if (isDev || !manifest) return [];

      /* Preload the AVIF srcset, not WebP: the <picture> in Avatar.jsx
         lists AVIF first, so on AVIF-capable browsers the preloaded
         file is the one actually used. Preloading WebP produced a
         "resource preloaded but not used" console warning. */
      return [
        {
          tag: 'link',
          attrs: {
            rel: 'preload',
            as: 'image',
            href: manifest.avif[manifest.avif.length - 1].url,
            imagesrcset: buildSrcset(manifest.avif),
            imagesizes: manifest.sizes,
            fetchpriority: 'high',
          },
          injectTo: 'head-prepend',
        },
      ];
    },

    /**
     * Remove the original full-size image from the bundle.
     * import.meta.glob in useProfileImage.js causes Vite to include the
     * original PNG as an asset — we strip it here since the optimised
     * variants in public/_hero/ replace it.
     */
    generateBundle(_, bundle) {
      if (isDev || !manifest) return;

      for (const key of Object.keys(bundle)) {
        const asset = bundle[key];
        // Match image assets from the Image/ directory
        if (
          asset.type === 'asset' &&
          typeof asset.originalFileName === 'string' &&
          asset.originalFileName.startsWith('Image/')
        ) {
          console.log(`[hero-image] Removed bundled original: ${key}`);
          delete bundle[key];
        }
      }
    },
  };
}
