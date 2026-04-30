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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(skills).map(([key, items], idx) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ delay: idx * 0.05, duration: 0.35 }}
          >
            <Card className="h-full p-5 sm:p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-accent-muted">
                {labels[key] ?? key}
              </h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {items.map((skill) => (
                  <li key={skill}>
                    <Tag accent={highlightSet.has(skill)}>{skill}</Tag>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}
