import { motion } from 'framer-motion';
import { portfolio } from '../data/portfolio';
import { Container } from '../components/Container';
import { Button } from '../components/Button';
import { Tag } from '../components/Tag';
import { NavIcon } from '../components/icons/NavIcons';
import { externalLinkProps } from '../utils/links';

const item = {
  hidden: { opacity: 0, y: 20 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function HeroSection() {
  const { name, username, title, bio, highlightedSkills, resumeLink, githubProfile } = portfolio;

  return (
    <section
      id="hero"
      className="relative flex min-h-[88vh] flex-col justify-center py-20 sm:min-h-[85vh] sm:py-24"
    >
      <Container className="relative z-10 text-center">
        <motion.p
          custom={0}
          variants={item}
          initial="hidden"
          animate="show"
          className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-accent-muted sm:text-sm"
        >
          {portfolio.location}
        </motion.p>
        <motion.h1
          custom={1}
          variants={item}
          initial="hidden"
          animate="show"
          className="text-4xl font-bold tracking-tight text-slate-50 sm:text-5xl lg:text-6xl"
        >
          {(() => {
            const parts = name.split(' ');
            const last = parts.pop();
            const rest = parts.join(' ');
            return (
              <>
                {rest && `${rest} `}
                <span className="bg-gradient-to-r from-accent via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                  {last}
                </span>
              </>
            );
          })()}
        </motion.h1>
        <motion.p
          custom={2}
          variants={item}
          initial="hidden"
          animate="show"
          className="mt-3 font-mono text-base font-semibold tracking-tight text-accent sm:text-lg"
        >
          {username}
        </motion.p>
        <motion.p
          custom={3}
          variants={item}
          initial="hidden"
          animate="show"
          className="mx-auto mt-4 max-w-xl text-lg font-semibold text-slate-200 sm:text-xl"
        >
          {title}
        </motion.p>
        <motion.p
          custom={4}
          variants={item}
          initial="hidden"
          animate="show"
          className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base"
        >
          {bio}
        </motion.p>

        <motion.div
          custom={5}
          variants={item}
          initial="hidden"
          animate="show"
          className="mx-auto mt-8 flex max-w-lg flex-wrap justify-center gap-2"
        >
          {highlightedSkills.map((s) => (
            <Tag key={s} accent>
              {s}
            </Tag>
          ))}
        </motion.div>

        <motion.div
          custom={6}
          variants={item}
          initial="hidden"
          animate="show"
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Button href={resumeLink} variant="primary" download>
            <NavIcon name="document" className="h-4 w-4" />
            Download resume
          </Button>
          <Button {...externalLinkProps(githubProfile)} variant="secondary">
            <NavIcon name="github" className="h-4 w-4" />
            View GitHub
          </Button>
        </motion.div>
      </Container>
    </section>
  );
}
