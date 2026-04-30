import { motion } from 'framer-motion';
import { portfolio } from '../data/portfolio';
import { SectionWrapper } from '../components/SectionWrapper';
import { Card } from '../components/Card';
import { ServiceIcon } from '../components/icons/NavIcons';

export function ServicesSection() {
  const { services } = portfolio;

  return (
    <SectionWrapper
      id="services"
      title="Services"
      subtitle="How I can help on small teams, coursework, and portfolio-grade products."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {services.map((s, idx) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ delay: idx * 0.06, duration: 0.35 }}
          >
            <Card className="flex gap-4 p-5 sm:p-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
                <ServiceIcon name={s.icon} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.description}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}
