import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Minimal photo lightbox for the hero portrait (Instagram-style).
 *
 * v2 — ROUND + DESKTOP ZOOM (Tamim, 2026-11-09):
 * - The opened photo is a CIRCLE, like Instagram's profile-pic view and
 *   like the hero avatar itself. Diameter min(92vw, 80vh, 560px), so it
 *   always fits the viewport. object-position center 20% keeps the head
 *   visible in the crop (same as the avatar). No buttons/text under the
 *   photo — Instagram's Follow/Share-profile UI is NOT copied.
 * - DESKTOP ZOOM (pointer: fine only — wheel + precise clicks need a
 *   mouse): click the photo zooms in one step (+0.5: 1 -> 1.5 -> 2; at
 *   max the next click resets to 1, so the user is never stuck zoomed).
 *   Wheel on the photo zooms continuously, clamped [1, 2]. Click or
 *   wheel on the BACKDROP closes (zoom out to normal = back to the hero
 *   view). Escape closes. NO pan/drag while zoomed — centre zoom only;
 *   for a face portrait the centre IS the face.
 * - MAX ZOOM 2 is a quality cap: the source photo is 880px wide, the
 *   circle displays at ~560px, so 2x renders ~1120px from an 880px
 *   source (mild 1.27x upscale, acceptable). Beyond 2x it would
 *   visibly blur. If Tamim ever provides a higher-res photo the cap
 *   can rise.
 * - TOUCH (coarse pointer): zoom controls OFF — tap the photo closes,
 *   exactly as v1. Only the shape changes to round.
 * - Behaviour change vs v1: click-on-photo NO LONGER closes on
 *   desktop (it zooms now). Close is backdrop click / backdrop wheel /
 *   Escape.
 * - The large variant loads ONLY on click: this component (and its
 *   <picture>) mounts only while open, so no 800w/880w request happens
 *   before the first open.
 * - Reduced motion: instant open/close and instant zoom steps, no
 *   scale/fade/transition at all.
 * - Accessibility: role="dialog" aria-modal, Escape closes, focus moves
 *   into the dialog on open (Avatar.jsx returns it to the avatar on
 *   close), Tab cycles between the dialog and the close button (the
 *   two focusable stops), body scroll locks while open and is restored
 *   on unmount.
 * - Close button (Tier 2): a visible × in the top-right corner, so
 *   mouse users don't have to discover click-anywhere. It stops
 *   propagation — clicking it closes without zooming — and it is a
 *   real <button> with a visible focus ring.
 */
export function PhotoLightbox({ manifest, src, alt, onClose }) {
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef(null);
  const closeRef = useRef(null);

  /* Desktop zoom state. The component remounts on every open, so zoom
     always starts at 1 — no reset needed. */
  const [zoom, setZoom] = useState(1);
  /* Zoom needs a mouse: evaluated on mount (i.e. on open), per the
     live pointer. Headless Chrome reports (pointer: none), so zoom
     tests must run in headed Chrome under Xvfb. */
  const [finePointer] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: fine)').matches,
  );

  /* Escape closes; Tab cycles between the dialog and the close
     button (the two focusable stops) so a keyboard user can reach
     Close; focus never escapes to the page behind. Body scroll
     locks while open; focus moves into the dialog on mount. */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        e.preventDefault();
        if (document.activeElement === closeRef.current) dialogRef.current?.focus();
        else closeRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  /* Gentle scale 0.96→1 + fade; instant when reduced motion is on. */
  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.25, ease: 'easeOut' };
  const overlayAnim = reduceMotion
    ? { initial: false }
    : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
  const photoAnim = reduceMotion
    ? { initial: false }
    : {
        initial: { opacity: 0, scale: 0.96 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.96 },
      };

  /* Desktop: click the photo zooms in a step; at max it resets to 1.
     Touch: tap the photo closes (v1 behaviour — zoom needs a mouse).
     stopPropagation keeps the overlay's click-to-close from firing. */
  const onPhotoClick = (e) => {
    e.stopPropagation();
    if (!finePointer) {
      onClose();
      return;
    }
    setZoom((z) => (z >= 2 ? 1 : Math.min(2, z + 0.5)));
  };

  /* Desktop: wheel on the photo zooms continuously, clamped [1, 2].
     Wheel down at 1x does nothing — it stays open, never closes by
     accident. No preventDefault needed: body scroll is locked while
     the lightbox is open, so the wheel has nothing to scroll. */
  const onPhotoWheel = (e) => {
    if (!finePointer) return;
    e.stopPropagation();
    setZoom((z) => Math.min(2, Math.max(1, z - e.deltaY * 0.002)));
  };

  /* Lightbox-appropriate sizes so the browser picks 480/800/880w as
     needed. The circle displays at up to 560px (the 80vh cap binds
     below that on short viewports). The avatar's own sizes (192-288px)
     must NOT be reused here, or the browser would serve the small
     variant. */
  const lightboxSizes = '(max-width: 640px) 92vw, 560px';

  /* The circle: fixed diameter min(92vw, 80vh, 560px), overflow-hidden
     so the cover crop is a true circle. The img fills the square with
     object-cover + center 20% — the same crop as the avatar. Zoom is
     a plain scale() on this div (NOT on the motion.div above — Framer
     Motion owns that element's transform for the open animation, and
     nested transforms compose). Zoom transition 0.2s; instant under
     reduced motion. */
  const zoomTransition = reduceMotion
    ? ''
    : 'transition-transform duration-200 ease-out';
  const photo =
    manifest && !manifest.dev ? (
      <picture className="block h-full w-full">
        <source
          type="image/avif"
          srcSet={manifest.avifSrcset}
          sizes={lightboxSizes}
        />
        <source
          type="image/webp"
          srcSet={manifest.webpSrcset}
          sizes={lightboxSizes}
        />
        <img
          src={manifest.pngFallback}
          alt={alt}
          width={manifest.width}
          height={manifest.height}
          loading="eager"
          decoding="async"
          className="h-full w-full object-cover"
          style={{ objectPosition: 'center 20%' }}
        />
      </picture>
    ) : (
      <img
        src={manifest?.src || src}
        alt={alt}
        loading="eager"
        decoding="async"
        className="h-full w-full object-cover"
        style={{ objectPosition: 'center 20%' }}
      />
    );

  return createPortal(
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      tabIndex={-1}
      onClick={onClose}
      /* Wheel on the backdrop closes (zoom out to normal = back to the
         hero view). Wheel on the photo never reaches here — the photo
         stops propagation and zooms instead. */
      onWheel={onClose}
      className="fixed inset-0 z-[60] flex cursor-zoom-out items-center justify-center bg-black/70 p-4 backdrop-blur-md focus-visible:outline-none"
      {...overlayAnim}
      transition={transition}
    >
      {/* Visible close button (top-right). stopPropagation keeps the
          overlay's click-to-close from firing too — the click closes
          via this button only, and never zooms (it sits outside the
          photo, so the photo's click/wheel handlers don't apply). */}
      <button
        type="button"
        ref={closeRef}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 motion-reduce:transition-none"
      >
        <X className="h-5 w-5" aria-hidden />
      </button>
      <motion.div className="flex justify-center" {...photoAnim} transition={transition}>
        <div
          onClick={onPhotoClick}
          onWheel={onPhotoWheel}
          style={{ transform: `scale(${zoom})` }}
          className={`relative aspect-square w-[min(92vw,80vh,560px)] cursor-zoom-in overflow-hidden rounded-full shadow-2xl ${zoomTransition}`}
        >
          {photo}
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
