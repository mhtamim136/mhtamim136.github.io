/**
 * Auto-discovers profile images from /Image/ at build time.
 *
 * Uses Vite's `import.meta.glob` (eager) so every file in the Image/
 * folder is included in the bundle without hardcoding a filename.
 * Returns the URL of the first image found, or null if the folder
 * is empty — letting the hero gracefully degrade to text-only.
 */
export function useProfileImage() {
  /* Eager glob — resolved at build time, zero runtime cost.
     Supports png, jpg, jpeg, webp, avif. */
  const images = import.meta.glob('/Image/*.{png,jpg,jpeg,webp,avif}', {
    eager: true,
    import: 'default',
  });

  const entries = Object.values(images);
  return entries.length > 0 ? entries[0] : null;
}
