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
 *   slide swaps to the placeholder there).
 *
 * The hero circle does NOT use this component — it keeps its
 * face-filling object-cover <picture> (srcset, center 20% crop).
 */
export function FitImage({ src, alt, objectPosition, imgClassName = '', onError }) {
  const style = objectPosition ? { objectPosition } : undefined;
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
      <img
        src={src}
        alt={alt}
        loading="eager"
        decoding="async"
        draggable={false}
        onError={onError}
        className={`relative h-full w-full object-contain${imgClassName ? ` ${imgClassName}` : ''}`}
        style={style}
      />
    </div>
  );
}
