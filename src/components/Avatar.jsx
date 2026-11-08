import { motion, useReducedMotion } from 'framer-motion';

/**
 * Circular avatar with a themed glow ring.
 *
 * - Dark mode: cyan-accent outer glow + subtle rotating gradient border
 * - Light mode: softer teal shadow, crisp ring
 * - object-position: center 20% keeps the head visible in the crop
 * - Hover: the inner image zooms 1.03× inside its overflow-hidden
 *   frame and the glow lifts slightly; the wrapper never scales and
 *   no clip-path is used, so the rings stay intact (the 2026-11-09
 *   Direction A lesson). Disabled under reduced motion.
 *
 * Accepts either:
 *   (a) An image manifest from virtual:hero-image-manifest (with AVIF/WebP/PNG
 *       srcsets for build mode), or
 *   (b) A plain string URL for dev mode or fallback.
 */
export function Avatar({ src, manifest, alt, className = '' }) {
  const imgStyle = { objectPosition: 'center 20%' };
  const reduceMotion = useReducedMotion();
  /* Subtle hover (see header): inner image zoom + glow lift, both
     gated off entirely under reduced motion — no transform at all. */
  const hoverImg = reduceMotion ? '' : 'transition-transform duration-300 group-hover:scale-[1.03]';
  const hoverGlow = reduceMotion ? '' : 'transition-opacity duration-300 group-hover:opacity-80';
  const imgClass = `h-full w-full object-cover ${hoverImg}`;

  return (
    <motion.div
      className={`group relative mx-auto ${className}`}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
    >
      {/* Outer glow ring — gentle float; the photo itself never moves */}
      <motion.div
        className={`absolute -inset-1 rounded-full bg-gradient-to-br from-accent via-[var(--gradient-via)] to-[var(--gradient-to)] opacity-60 blur-md ${hoverGlow}`}
        aria-hidden
        animate={reduceMotion ? { y: 0 } : { y: [0, -6, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Gradient border ring */}
      <div
        className="absolute -inset-[3px] rounded-full bg-gradient-to-br from-accent via-[var(--gradient-via)] to-[var(--gradient-to)] opacity-80"
        aria-hidden
      />
      {/* White/dark gap ring between border and image */}
      <div className="absolute -inset-[1px] rounded-full bg-surface" aria-hidden />
      {/* Image container */}
      <div className="relative aspect-square w-full overflow-hidden rounded-full shadow-glass">
        {manifest && !manifest.dev ? (
          <picture>
            <source
              type="image/avif"
              srcSet={manifest.avifSrcset}
              sizes={manifest.sizes}
            />
            <source
              type="image/webp"
              srcSet={manifest.webpSrcset}
              sizes={manifest.sizes}
            />
            <img
              src={manifest.pngFallback}
              alt={alt}
              width={manifest.width}
              height={manifest.height}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className={imgClass}
              style={imgStyle}
            />
          </picture>
        ) : (
          <img
            src={manifest?.src || src}
            alt={alt}
            width={280}
            height={280}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className={imgClass}
            style={imgStyle}
          />
        )}
      </div>
    </motion.div>
  );
}
