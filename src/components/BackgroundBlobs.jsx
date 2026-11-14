import { useEffect, useRef } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';

/**
 * Decorative background blobs — slow-floating organic gradient shapes.
 * Pinned behind all content with fixed positioning.
 * Uses CSS animations to keep them off the main thread.
 *
 * Scroll pause (Tier 4, A-4): three large blurred layers animating
 * transform forever is constant compositor work that competes with
 * scroll compositing exactly while the user is flinging. While any
 * scroll is in flight the drift pauses (animation-play-state), and
 * resumes ~250ms after the last scroll event. The blobs move so
 * slowly (22-30s cycles) that a pause mid-scroll is invisible —
 * the user is watching content move, not the background. C1 F2:
 * the pause is a DOM class toggle on the container, not React
 * state — same pause/resume moments, no re-render. Reduced
 * motion (W17): the gate is the LIVE useMediaQuery hook, the same
 * one Spotlight/useLenis use — the old mount-only matchMedia check
 * never noticed an OS setting toggled mid-session. While reduced
 * motion is on the listener is detached and the global kill-switch
 * freezes the animation; toggling it back off re-attaches the
 * listener and clears any stale paused state.
 */
export function BackgroundBlobs() {
  const containerRef = useRef(null);
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    if (prefersReducedMotion) {
      return undefined;
    }
    /* Fresh start when the gate flips back on: a pause left over
       from before reduced motion was enabled must not stick. */
    containerRef.current?.classList.remove('blobs-paused');
    let timer = 0;
    let isPaused = false;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!isPaused) {
          isPaused = true;
          containerRef.current?.classList.add('blobs-paused');
        }
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          isPaused = false;
          containerRef.current?.classList.remove('blobs-paused');
        }, 250);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
      containerRef.current?.classList.remove('blobs-paused');
    };
  }, [prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      {/* Top-right blob — opacity comes from --blob-1 so the light
          theme (bright page) gets a touch more presence. */}
      <div
        className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full blur-[100px] sm:h-[600px] sm:w-[600px]"
        style={{
          background: 'radial-gradient(circle, rgb(var(--accent)) 0%, transparent 70%)',
          opacity: 'var(--blob-1)',
          animation: 'blob-float 22s ease-in-out infinite',
        }}
      />
      {/* Bottom-left blob */}
      <div
        className="absolute -bottom-40 -left-40 h-[450px] w-[450px] rounded-full blur-[100px] sm:h-[550px] sm:w-[550px]"
        style={{
          background: 'radial-gradient(circle, var(--gradient-via) 0%, transparent 70%)',
          opacity: 'var(--blob-2)',
          animation: 'blob-float 26s ease-in-out infinite reverse',
        }}
      />
      {/* Centre-right blob (only visible on larger screens) */}
      <div
        className="absolute right-1/4 top-1/2 hidden h-[400px] w-[400px] -translate-y-1/2 rounded-full blur-[100px] lg:block"
        style={{
          background: 'radial-gradient(circle, var(--gradient-to) 0%, transparent 70%)',
          opacity: 'var(--blob-3)',
          animation: 'blob-float 30s ease-in-out infinite 5s',
        }}
      />
    </div>
  );
}
