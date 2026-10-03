import { Container } from './Container';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export function SectionWrapper({
  id,
  className = '',
  children,
  title,
  subtitle,
  titleClassName = '',
}) {
  return (
    <section id={id} className={`relative py-16 sm:py-20 lg:py-24 ${className}`}>
      <Container>
        {(title || subtitle) && (
          <motion.header
            variants={fadeUp}
            initial="hidden"
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
                  className={`font-display text-2xl font-semibold tracking-tight text-heading sm:text-3xl ${titleClassName}`}
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
