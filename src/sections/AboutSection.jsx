import { motion, useReducedMotion } from 'framer-motion';
import { portfolio } from '../data/portfolio';
import { SectionWrapper } from '../components/SectionWrapper';
import { Card } from '../components/Card';

export function AboutSection() {
  const { about, institution, currentlyLearning } = portfolio;
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <SectionWrapper
      id="about"
      title="About me"
      subtitle="Background, focus, and how I like to build."
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.35 }}
      >
        <Card className="p-6 sm:p-8">
          <p className="text-sm leading-relaxed text-subtle sm:text-base">{about}</p>
          <dl className="mt-6 grid gap-4 border-t border-glass/[0.06] pt-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-dim">
                Institution
              </dt>
              <dd className="mt-1 text-sm text-body">{institution}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-dim">
                Currently Learning
              </dt>
              <dd className="mt-1 text-sm text-body">{currentlyLearning.join(' · ')}</dd>
            </div>
          </dl>
        </Card>
      </motion.div>
    </SectionWrapper>
  );
}
