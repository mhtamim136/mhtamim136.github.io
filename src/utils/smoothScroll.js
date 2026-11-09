/**
 * Smooth-scroll plumbing shared by Lenis and the native fallback.
 *
 * A single Lenis instance is owned by `useLenis` (created in App).
 * It registers itself here so any component can scroll through it
 * without prop-drilling. When no instance exists — Lenis is off,
 * e.g. under prefers-reduced-motion — callers fall back to a native
 * `window.scrollTo` with the same reduced-motion check the call
 * sites used before.
 *
 * Targets are absolute scroll positions (numbers), exactly like the
 * `top` values the call sites already compute (`el.top + scrollY -
 * NAV_OFFSET_PX`). Lenis clamps numbers to the scroll limit itself.
 */
let lenisInstance = null;

export function setLenis(instance) {
  lenisInstance = instance;
}

export function getLenis() {
  return lenisInstance;
}

export function smoothScrollTo(top) {
  if (lenisInstance) {
    lenisInstance.scrollTo(top);
    return;
  }
  const reduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
}
