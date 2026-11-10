import { motion, useReducedMotion } from 'framer-motion';
import { portfolio } from '../data/portfolio';
import { SectionWrapper } from '../components/SectionWrapper';
import { Card } from '../components/Card';

export function ExperienceSection() {
  const { experience } = portfolio;
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <SectionWrapper
      id="experience"
      title="Experience"
      subtitle="Academic path and how I spend my build time."
    >
      <div className="relative pl-2 sm:pl-4">
        {/* Timeline line draws top-to-bottom as the section scrolls
            into view (anim #4): scaleY 0→1 from the top, 0.8s
            expo-out, once. Decorative (aria-hidden). Under reduced
            motion it renders at full height statically. */}
        <motion.div
          initial={reduceMotion ? false : { scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: 'top' }}
          className="absolute bottom-0 left-[15px] top-0 w-px bg-gradient-to-b from-accent/50 via-glass/10 to-transparent sm:left-[19px]"
          aria-hidden
        />
        <ul className="space-y-10 sm:space-y-12">
          {experience.map((job, idx) => (
            <motion.li
              key={`${job.company}-${job.role}`}
              initial={reduceMotion ? false : { opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: idx * 0.08, duration: 0.35 }}
              className="group relative pl-10 sm:pl-12"
            >
              {/* Timeline dot pops in (anim #4) on the same stagger
                  as its row, spring 260/26. The pop rides an OUTER
                  wrapper: framer-motion leaves an inline transform
                  on the element it animates, which would override
                  the inner dot's CSS group-hover:scale-125 — so the
                  hover (scale 1.25 + glow) stays on the inner span,
                  untouched, and still works. */}
              <motion.span
                initial={reduceMotion ? false : { scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: idx * 0.08, type: 'spring', stiffness: 260, damping: 26 }}
                className="absolute left-[10px] top-2 h-3 w-3 sm:left-[14px]"
                aria-hidden
              >
                <span className="block h-full w-full rounded-full border-2 border-accent bg-surface shadow-[0_0_12px_rgb(var(--accent)_/_0.5)] transition-all duration-300 group-hover:scale-125 group-hover:shadow-[0_0_16px_rgb(var(--accent)_/_0.7)]" />
              </motion.span>
              {/* The shared Card — same tilt + hover treatment as every
                  other card on the site, so Experience no longer reads
                  as the one static section. */}
              <Card className="p-5 sm:p-6">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <h3 className="text-base font-semibold text-heading sm:text-lg">{job.role}</h3>
                  <span className="text-xs font-medium uppercase tracking-wider text-accent/65 sm:text-sm">
                    {job.duration}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">{job.company}</p>
                <ul className="mt-4 list-disc space-y-2 pl-4 text-sm text-subtle marker:text-accent/80">
                  {job.points.map((pt, i) => (
                    <motion.li
                      key={pt}
                      className="leading-relaxed"
                      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.05, duration: 0.3 }}
                    >
                      {pt}
                    </motion.li>
                  ))}
                </ul>
              </Card>
            </motion.li>
          ))}
        </ul>
      </div>
    </SectionWrapper>
  );
}
