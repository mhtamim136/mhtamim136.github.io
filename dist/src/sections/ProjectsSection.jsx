import { motion } from 'framer-motion';
import { portfolio } from '../data/portfolio';
import { SectionWrapper } from '../components/SectionWrapper';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Tag } from '../components/Tag';
import { externalLinkProps } from '../utils/links';

export function ProjectsSection() {
  const { projects } = portfolio;

  return (
    <SectionWrapper
      id="projects"
      title="Projects"
      subtitle="Problem-first breakdowns and what shipped in code."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {projects.map((project, idx) => (
          <motion.div
            key={project.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: idx * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card
              className="flex h-full flex-col p-6 sm:p-7"
              whileHover={{ y: -6, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-lg font-semibold text-slate-100 sm:text-xl">{project.title}</h3>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
                <p>
                  <span className="font-medium text-slate-400">Problem · </span>
                  {project.problem}
                </p>
                <p>
                  <span className="font-medium text-slate-400">Solution · </span>
                  {project.solution}
                </p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {project.tech.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
              <div className="mt-auto flex flex-wrap gap-3 pt-6">
                {project.live && (
                  <Button {...externalLinkProps(project.live)} variant="primary" className="flex-1 sm:flex-none">
                    Live demo
                  </Button>
                )}
                <Button {...externalLinkProps(project.github)} variant="secondary">
                  GitHub
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}
