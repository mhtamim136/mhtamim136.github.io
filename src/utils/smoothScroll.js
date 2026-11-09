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

/* Demand-loop kick (P8): useLenis registers the function that wakes
   its rAF loop; smoothScrollTo calls it after a programmatic
   scrollTo, so an anchor / scroll-to animation actually advances.
   Null when no Lenis instance exists (reduced motion) — the same
   shape as the instance registry above, and for the same reason:
   any component can scroll through Lenis without prop-drilling. */
let rafKick = null;

export function setLenis(instance) {
  lenisInstance = instance;
}

export function setLenisRafKick(fn) {
  rafKick = fn;
}

export function getLenis() {
  return lenisInstance;
}

export function smoothScrollTo(top) {
  if (lenisInstance) {
    lenisInstance.scrollTo(top);
    rafKick?.();
    return;
  }
  const reduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
}
