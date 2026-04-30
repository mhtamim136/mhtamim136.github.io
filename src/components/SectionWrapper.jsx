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
              <h2
                className={`text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl ${titleClassName}`}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">{subtitle}</p>
            )}
          </motion.header>
        )}
        {children}
      </Container>
    </section>
  );
}
