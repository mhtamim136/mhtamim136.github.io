import { motion } from 'framer-motion';
import { portfolio } from '../data/portfolio';
import { SectionWrapper } from '../components/SectionWrapper';
import { Card } from '../components/Card';
import { Tag } from '../components/Tag';

const labels = {
  languages: 'Languages',
  frontend: 'Frontend',
  backend: 'Backend',
  database: 'Database',
  concepts: 'Concepts',
};

export function SkillsSection() {
  const { skills, highlightedSkills } = portfolio;
  const highlightSet = new Set(highlightedSkills);

  return (
    <SectionWrapper
      id="skills"
      title="Skills"
      subtitle="Grouped stack with emphasis on the tools I reach for most often."
    >
      {/* The teal pills mark the tools reached for most often. */}
      <p className="mb-4 flex items-center gap-2 text-xs text-muted-dim">
        <span className="inline-block h-2 w-2 rounded-full bg-accent" aria-hidden />
        Teal = most used
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(skills).map(([key, items], idx) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ delay: idx * 0.05, duration: 0.35 }}
          >
            <Card className="h-full p-5 sm:p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-accent/65">
                {labels[key] ?? key}
              </h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {items.map((skill, i) => (
                  /* Pills cascade in gently (20ms apart) instead of
                     appearing all at once — the section feels alive
                     on scroll without any single pill shouting. */
                  <motion.li
                    key={skill}
                    initial={{ opacity: 0, y: 4 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 + i * 0.02, duration: 0.25 }}
                  >
                    <Tag accent={highlightSet.has(skill)}>{skill}</Tag>
                  </motion.li>
                ))}
              </ul>
            </Card>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}
