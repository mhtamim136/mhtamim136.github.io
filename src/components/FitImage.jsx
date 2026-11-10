import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Shared image fit — the WHOLE image always shows: object-contain
 * over a blurred, enlarged copy of the SAME image filling the box
 * (same URL, so no extra fetch — the browser cache serves the
 * backdrop). A tall or small screenshot is never cropped or
 * over-zoomed, and the backdrop fills the bands — the premium
 * gallery look.
 *
 * One component for the three call sites that used to repeat this
 * markup verbatim (PhotoLightbox `photo` rect fallback +
 * `cellPhoto`, ProjectSlideshow `cellContent`):
 * - the backdrop is presentational (aria-hidden,
 *   pointer-events-none) and never intercepts pointer events —
 *   the drag handlers live on the cell divs, not here;
 * - the main image carries the real alt text (or '' for adjacent
 *   cells, which are presentational);
 * - `objectPosition` shifts the crop inside the frame (the
 *   lightbox passes 'center'); `imgClassName` adds call-site
 *   classes to the main image (the slideshow's hover zoom);
 * - `onError` reports a failed load (slideshow only — a failed
 *   slide swaps to the placeholder there); `onLoad` reports a
 *   successful load of the MAIN image only (slideshow only — the
 *   auto-advance gate waits on it; the backdrop is the same URL,
 *   so its load adds nothing).
 *
 * Load reveal (anim #2, 2026-11-10): the main image fades +
 * settles in (opacity 0→1, scale 1.04→1, 0.5s expo-out) instead
 * of popping — the blurred backdrop is already there, so the
 * reveal reads as a focus pull, the same language as the hero.
 * `revealed` is set by the main img's onLoad (and by the
 * `complete` check on mount, for cached images); a failed image
 * counts as revealed too, so it can never stay invisible. The
 * passed `onLoad` still fires — the reveal and the S1
 * auto-advance gate share the one load event.
 *
 * The hero circle does NOT use this component — it keeps its
 * face-filling object-cover <picture> (srcset, center 20% crop).
 */

export function FitImage({ src, alt, objectPosition, imgClassName = '', onError, onLoad }) {
  const style = objectPosition ? { objectPosition } : undefined;
  const reduceMotion = useReducedMotion() ?? false;
  /* Load reveal (anim #2) — see header. Reset on every src
     change: a new image starts hidden until it loads (or is
     already cached-complete). */
  const [revealed, setRevealed] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete) setRevealed(true);
    else setRevealed(false);
  }, [src]);

  /* The passed handlers still fire (S1 auto-advance gate reads
     onLoad; the slideshow's failed map reads onError) — the
     reveal and the gate share the one load event. */
  const handleLoad = (e) => {
    setRevealed(true);
    onLoad?.(e);
  };
  const handleError = (e) => {
    setRevealed(true);
    onError?.(e);
  };

  /* Reduced motion: render revealed immediately, no transition
     (the global kill-switch would collapse the transition anyway,
     but the initial class is gated too so there is no flash of a
     hidden image).
     The reveal rides a WRAPPER div around the main img, not the
     img itself: the slideshow passes `transition-transform` via
     imgClassName, and that rule sorts AFTER `transition-all` in
     the built CSS (verified — an arbitrary
     `transition-[opacity,transform]` also sorts BEFORE it), so a
     transition on the img would leave opacity with no transition
     at all (a pop, not a fade). The wrapper carries no competing
     transition class, so its `transition-all` is deterministic —
     and the img keeps its own classes and hover zoom byte-identical. */
  const revealClass = reduceMotion || revealed ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.04]';
  const revealTransition = reduceMotion
    ? ''
    : ' transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]';

  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading="eager"
        decoding="async"
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover blur-xl brightness-[0.85]"
        style={style}
      />
      {/* Load-reveal wrapper (anim #2): fades + settles the main
          image in on load. The img inside keeps its own classes
          (incl. the slideshow's group-hover:scale-105) untouched. */}
      <div className={`relative h-full w-full ${revealClass}${revealTransition}`}>
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading="eager"
          decoding="async"
          draggable={false}
          onError={handleError}
          onLoad={handleLoad}
          className={`relative h-full w-full object-contain${imgClassName ? ` ${imgClassName}` : ''}`}
          style={style}
        />
      </div>
    </div>
  );
}
