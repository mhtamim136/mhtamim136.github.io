/**
 * Auto-discovers profile images from /Image/ at build time.
 *
 * In PROD: Returns null — the optimised hero image is served via
 * the virtual:hero-image-manifest from the Vite plugin instead.
 * The glob is wrapped in a dead-code branch so Vite tree-shakes
 * it out of the production bundle entirely.
 *
 * In DEV: Uses Vite's `import.meta.glob` (eager) for hot-reload.
 */
export function useProfileImage() {
  if (import.meta.env.DEV) {
    /* This glob is inside a DEV-only branch.
       Vite statically analyses import.meta.glob regardless of branches,
       BUT the resulting asset URL is only used in dev mode.
       In production, heroManifest provides the optimised URLs. */
    const images = import.meta.glob('/Image/*.{png,jpg,jpeg,webp,avif}', {
      eager: true,
      import: 'default',
    });
    const entries = Object.values(images);
    return entries.length > 0 ? entries[0] : null;
  }

  return null;
}
