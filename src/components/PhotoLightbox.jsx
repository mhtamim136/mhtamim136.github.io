import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Minimal photo lightbox for the hero portrait (Instagram-style).
 *
 * - Opens from the Avatar on click; the FULL portrait (880x1206) floats
 *   up over a dark blurred backdrop — never the circle crop, never
 *   fullscreen. Click ANYWHERE (backdrop or photo) or press Escape to
 *   close; open/close IS the zoom (no pinch, slider, buttons, caption).
 * - The large variant loads ONLY on click: this component (and its
 *   <picture>) mounts only while open, so no 800w/880w request happens
 *   before the first open.
 * - Reduced motion: instant open/close, no scale/fade at all.
 * - Accessibility: role="dialog" aria-modal, Escape closes, focus moves
 *   into the dialog on open (Avatar.jsx returns it to the avatar on
 *   close), Tab is held on the dialog (the single focusable stop), body
 *   scroll locks while open and is restored on unmount.
 */
export function PhotoLightbox({ manifest, src, alt, onClose }) {
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef(null);

  /* Escape closes; Tab stays on the dialog; body scroll locks while
     open; focus moves into the dialog on mount. */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') e.preventDefault();
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

  /* Lightbox-appropriate sizes so the browser picks 480/800/880w as
     needed. The avatar's own sizes (192-288px) must NOT be reused here,
     or the browser would serve the small variant. */
  const lightboxSizes = '(max-width: 640px) 92vw, 520px';

  const photo =
    manifest && !manifest.dev ? (
      <picture>
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
          className="block h-auto w-auto max-h-[80vh] max-w-[min(92vw,560px)] rounded-2xl object-contain shadow-2xl"
        />
      </picture>
    ) : (
      <img
        src={manifest?.src || src}
        alt={alt}
        loading="eager"
        decoding="async"
        className="block h-auto w-auto max-h-[80vh] max-w-[min(92vw,560px)] rounded-2xl object-contain shadow-2xl"
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
      className="fixed inset-0 z-[60] flex cursor-zoom-out items-center justify-center bg-black/70 p-4 backdrop-blur-md focus-visible:outline-none"
      {...overlayAnim}
      transition={transition}
    >
      {/* The frame shrink-wraps the photo: the img sizes itself with
          w-auto + max-w/max-h (the classic pattern), so when the 80vh
          height cap binds, the width shrinks with it and the frame is
          never wider than the visible photo — no letterbox gap. */}
      <motion.div className="flex justify-center" {...photoAnim} transition={transition}>
        {photo}
      </motion.div>
    </motion.div>,
    document.body,
  );
}
