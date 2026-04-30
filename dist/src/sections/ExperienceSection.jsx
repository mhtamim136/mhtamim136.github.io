import { motion } from 'framer-motion';
import { portfolio } from '../data/portfolio';
import { SectionWrapper } from '../components/SectionWrapper';

export function ExperienceSection() {
  const { experience } = portfolio;

  return (
    <SectionWrapper
      id="experience"
      title="Experience"
      subtitle="Academic path and how I spend my build time."
    >
      <div className="relative pl-2 sm:pl-4">
        <div
          className="absolute bottom-0 left-[15px] top-0 w-px bg-gradient-to-b from-accent/50 via-white/10 to-transparent sm:left-[19px]"
          aria-hidden
        />
        <ul className="space-y-10 sm:space-y-12">
          {experience.map((job, idx) => (
            <motion.li
              key={`${job.company}-${job.role}`}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: idx * 0.08, duration: 0.35 }}
              className="relative pl-10 sm:pl-12"
            >
              <span
                className="absolute left-[10px] top-2 h-3 w-3 rounded-full border-2 border-accent bg-surface shadow-[0_0_12px_rgba(34,211,238,0.5)] sm:left-[14px]"
                aria-hidden
              />
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 shadow-glass backdrop-blur-xl sm:rounded-2xl sm:p-6">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <h3 className="text-base font-semibold text-slate-100 sm:text-lg">{job.role}</h3>
                  <span className="text-xs font-medium uppercase tracking-wider text-accent-muted sm:text-sm">
                    {job.duration}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">{job.company}</p>
                <ul className="mt-4 list-disc space-y-2 pl-4 text-sm text-slate-300 marker:text-accent/80">
                  {job.points.map((pt) => (
                    <li key={pt} className="leading-relaxed">
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </SectionWrapper>
  );
}
