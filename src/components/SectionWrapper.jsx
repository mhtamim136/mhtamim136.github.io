import { Container } from './Container';
import { motion, useReducedMotion } from 'framer-motion';

/* Tier 3 — the shared section-header reveal. The rise is capped at
   8px: below the smallest 10px gap on the page (Contact socials),
   so even if two adjacent reveals desync completely under a fast
   fling, their text can never overlap. The header keeps a real
   rise (not opacity-only) so the entrance still feels alive.
   Under reduced motion the header renders at its final state
   (initial={false}) — the opacity fade was one of the 18 fades
   that kept running under prefers-reduced-motion. */
const fadeUp = {
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export function SectionWrapper({
  id,
  className = '',
  children,
  title,
  subtitle,
}) {
  const reduceMotion = useReducedMotion() ?? false;
  return (
    <section id={id} className={`relative py-16 sm:py-20 lg:py-24 ${className}`}>
      <Container>
        {(title || subtitle) && (
          <motion.header
            variants={fadeUp}
            initial={reduceMotion ? false : 'hidden'}
            whileInView="show"
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10 sm:mb-14"
          >
            {title && (
              <div className="flex items-center gap-3">
                {/* Accent dash decoration */}
                <span
                  className="h-[3px] w-8 rounded-full bg-accent sm:w-10"
                  aria-hidden
                />
                <h2
                  className="font-display text-2xl font-semibold tracking-tight text-heading sm:text-3xl"
                >
                  {title}
                </h2>
              </div>
            )}
            {subtitle && (
              <p className="mt-3 max-w-2xl pl-11 text-sm text-muted sm:pl-[3.25rem] sm:text-base">
                {subtitle}
              </p>
            )}
          </motion.header>
        )}
        {children}
      </Container>
    </section>
  );
}
