import { motion } from 'framer-motion';

/**
 * Circular avatar with a themed glow ring.
 *
 * - Dark mode: cyan-accent outer glow + subtle rotating gradient border
 * - Light mode: softer teal shadow, crisp ring
 * - object-position: center 20% keeps the head visible in the crop
 */
export function Avatar({ src, alt, className = '' }) {
  return (
    <motion.div
      className={`relative mx-auto ${className}`}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
    >
      {/* Outer glow ring */}
      <div
        className="absolute -inset-1 rounded-full bg-gradient-to-br from-accent via-[var(--gradient-via)] to-[var(--gradient-to)] opacity-60 blur-md"
        aria-hidden
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
        <img
          src={src}
          alt={alt}
          width={280}
          height={280}
          loading="eager"
          decoding="async"
          className="h-full w-full object-cover"
          style={{ objectPosition: 'center 20%' }}
        />
      </div>
    </motion.div>
  );
}
