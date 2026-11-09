import { motion, useReducedMotion } from 'framer-motion';
import { portfolio } from '../data/portfolio';
import { SectionWrapper } from '../components/SectionWrapper';
import { Card } from '../components/Card';
import { ServiceIcon } from '../components/icons/NavIcons';

export function ServicesSection() {
  const { services } = portfolio;
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <SectionWrapper
      id="services"
      title="What I Build"
      subtitle="Things I build — interfaces, apps, and the data behind them."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {services.map((s, idx) => (
          <motion.div
            key={s.title}
            initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ delay: idx * 0.06, duration: 0.35 }}
            whileHover={{ y: -4 }}
          >
            <Card className="group flex gap-4 p-5 sm:p-6">
              {/* Icon chip answers the hover: deeper tint + the icon
                  grows a touch, so the card feels alive instead of
                  just sliding in once and going still. */}
              <div className="tone-accent flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent transition-all duration-300 group-hover:border-accent/40 group-hover:bg-accent/20">
                <ServiceIcon
                  name={s.icon}
                  className="transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div>
                <h3 className="font-semibold text-heading">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.description}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}
