import { memo, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { portfolio } from '../data/portfolio';
import { SectionWrapper } from '../components/SectionWrapper';
import { Card } from '../components/Card';
import { Tag } from '../components/Tag';
import { skillCounts, normalizeKey } from '../utils/skillProjectCounts';
import { smoothScrollTo } from '../utils/smoothScroll';
import { NAV_OFFSET_PX } from '../utils/navOffset';

const labels = {
  languages: 'Languages',
  frontend: 'Frontend',
  backend: 'Backend',
  database: 'Database',
  concepts: 'Concepts',
};

function SkillsSectionInner({ repos, activeFilter, onFilterChange }) {
  const { skills, highlightedSkills } = portfolio;
  const highlightSet = new Set(highlightedSkills);
  const reduceMotion = useReducedMotion() ?? false;

  /* Live counts per skill, derived from the same repo data the
     Projects grid reads — a future project auto-raises its
     language's count on the next sync, with zero code or data
     changes. The number is projects using the skill, never
     proficiency (no % bars anywhere). */
  const counts = useMemo(() => skillCounts(skills, repos), [skills, repos]);

  const handleSkillClick = (skill) => {
    const key = normalizeKey(skill);
    /* Clicking the active skill clears the filter (no scroll —
       the user is already looking at the skills). */
    if (activeFilter === key) {
      onFilterChange(null);
      return;
    }
    onFilterChange(key);
    const el = document.getElementById('projects');
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET_PX;
    /* Lenis when active, native smooth scroll otherwise (instant
       under reduced motion — the helper applies the same check). */
    smoothScrollTo(top);
  };

  return (
    <SectionWrapper
      id="skills"
      title="Skills"
      subtitle="Grouped stack with emphasis on the tools I reach for most often."
    >
      {/* The teal pills mark the tools reached for most often.
          A numbered pill filters the Projects section. This hint
          fades in with the section header (same 0.35s, same
          trigger) — it used to be a plain <p>, so mid-fling it was
          fully visible while the "Skills" heading was still fading
          in. (Tier 4 — the live audit's heading/sub-text look-alike.) */}
      <motion.p
        initial={reduceMotion ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-dim"
      >
        <span className="inline-block h-2 w-2 rounded-full bg-accent" aria-hidden />
        Teal = most used
        <span aria-hidden>·</span>
        Click a numbered skill to filter projects
      </motion.p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(skills).map(([key, items], idx) => (
          <motion.div
            key={key}
            initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ delay: idx * 0.05, duration: 0.35 }}
          >
            <Card className="h-full p-5 sm:p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-accent/65">
                {labels[key] ?? key}
              </h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {items.map((skill, i) => {
                  /* A pill is clickable only when at least one
                     project uses the skill — 0-match pills stay
                     plain text, never a dead click. */
                  const count = counts.get(skill) ?? 0;
                  const clickable = count >= 1;
                  const active = clickable && activeFilter === normalizeKey(skill);
                  return (
                    /* Pills cascade in gently (20ms apart) instead of
                       appearing all at once — the section feels alive
                       on scroll without any single pill shouting. */
                    <motion.li
                      key={skill}
                      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.05 + i * 0.02, duration: 0.25 }}
                    >
                      <Tag
                        accent={highlightSet.has(skill)}
                        button={clickable}
                        count={clickable ? count : null}
                        active={active}
                        onClick={clickable ? () => handleSkillClick(skill) : undefined}
                        ariaLabel={
                          clickable
                            ? `${skill}, ${count} ${count === 1 ? 'project' : 'projects'} — filter projects`
                            : undefined
                        }
                      >
                        {skill}
                      </Tag>
                    </motion.li>
                  );
                })}
              </ul>
            </Card>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}

/* W26: memo() — safe here because App passes stable props:
   `repos` is hook state (same reference between renders unless
   the data changes), `activeFilter` is state, and
   `onFilterChange` is a state setter. Same pattern as
   ProjectsSection. */
export const SkillsSection = memo(SkillsSectionInner);
