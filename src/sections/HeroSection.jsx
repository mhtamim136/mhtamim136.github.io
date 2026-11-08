import { motion } from 'framer-motion';
import { portfolio } from '../data/portfolio';
import { Container } from '../components/Container';
import { Button } from '../components/Button';
import { Magnetic } from '../components/Magnetic';
import { Tag } from '../components/Tag';
import { Avatar } from '../components/Avatar';
import { RoleLine } from '../components/RoleLine';
import { MaskedWords } from '../components/MaskedWords';
import { NavIcon } from '../components/icons/NavIcons';
import { externalLinkProps } from '../utils/links';
import { useProfileImage } from '../hooks/useProfileImage';
import heroManifest from 'virtual:hero-image-manifest';

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
  const profileImage = useProfileImage();
  const hasImage = Boolean(heroManifest || profileImage);

  /* ── Masked word reveal (#5) — name (3 words) then title
      (4 words) as one continuous stagger. The last name word
      keeps its gradient; the title words are plain. ── */
  const nameWords = name.split(' ').map((t, i, arr) => ({
    text: t,
    className: i === arr.length - 1 ? 'text-gradient' : undefined,
  }));
  const titleWords = title.split(' ').map((t) => ({ text: t }));

  /* ── Text column content (shared for both layouts) ── */
  const textContent = (
    <>
      <motion.p
        custom={0}
        variants={item}
        initial="hidden"
        animate="show"
        className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-accent/65 sm:text-sm"
      >
        {portfolio.location}
      </motion.p>

      {/* Name — masked word-by-word reveal. Plain h1 (no opacity
          fade): the reveal itself is the entrance, transform-only,
          and under reduced motion the words render in their final
          state instantly via <MotionConfig reducedMotion="user">. */}
      <h1 className="font-display text-4xl font-bold tracking-tight text-heading sm:text-5xl lg:text-6xl">
        <MaskedWords words={nameWords} baseDelay={0.05} />
      </h1>

      {/* Rotating role line — min-h keeps the swap from moving the
          layout below it. Placed under the name, before the username. */}
      <motion.p
        custom={1.5}
        variants={item}
        initial="hidden"
        animate="show"
        className="mt-3 min-h-[1.75rem] font-mono text-base font-medium text-accent sm:text-lg"
      >
        <RoleLine />
      </motion.p>

      <motion.p
        custom={2}
        variants={item}
        initial="hidden"
        animate="show"
        className="mt-3 font-mono text-base font-semibold tracking-tight text-accent sm:text-lg"
      >
        {username}
      </motion.p>

      {/* Title — masked word-by-word reveal, continuing the same
          stagger as the name (baseDelay 0.23). RoleLine above is
          untouched. */}
      <p className={`mt-4 text-lg font-semibold text-body sm:text-xl ${hasImage ? '' : 'mx-auto max-w-xl'}`}>
        <MaskedWords words={titleWords} baseDelay={0.23} />
      </p>

      <motion.p
        custom={4}
        variants={item}
        initial="hidden"
        animate="show"
        className={`mt-4 text-sm leading-relaxed text-muted sm:text-base ${hasImage ? 'max-w-lg' : 'mx-auto max-w-2xl'}`}
      >
        {bio}
      </motion.p>

      <motion.div
        custom={5}
        variants={item}
        initial="hidden"
        animate="show"
        className={`mt-8 flex flex-wrap gap-2 ${hasImage ? '' : 'mx-auto max-w-lg justify-center'}`}
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
        className={`mt-10 flex flex-wrap gap-4 ${hasImage ? '' : 'items-center justify-center'}`}
      >
        {/* Primary CTAs — magnetic (lean toward the pointer, capped
            so the two buttons can never overlap; see Magnetic.jsx). */}
        <Magnetic>
          <Button href={resumeLink} variant="primary" download>
            <NavIcon name="document" className="h-4 w-4" />
            Download resume
          </Button>
        </Magnetic>
        <Magnetic>
          <Button {...externalLinkProps(githubProfile)} variant="secondary">
            <NavIcon name="github" className="h-4 w-4" />
            View GitHub
          </Button>
        </Magnetic>
      </motion.div>
    </>
  );

  /* ── Two-column layout (image on right, text on left) ── */
  if (hasImage) {
    return (
      <section
        id="hero"
        className="relative flex min-h-[88vh] flex-col justify-center py-20 sm:min-h-[85vh] sm:py-24"
      >
        {/* Faint cyan glow behind the hero — depth, not decoration. */}
        <div className="pointer-events-none absolute inset-0 bg-hero-glow" aria-hidden />
        <Container className="relative z-10">
          <div className="flex flex-col-reverse items-center gap-12 lg:flex-row lg:items-center lg:gap-16">
            {/* Text — left */}
            <div className="flex-1 text-center lg:text-left">{textContent}</div>

            {/* Image — right on desktop, top on mobile */}
            <motion.div
              className="w-48 shrink-0 sm:w-56 lg:w-64 xl:w-72"
              custom={0}
              variants={item}
              initial="hidden"
              animate="show"
            >
              <Avatar manifest={heroManifest} src={profileImage} alt={`Portrait of ${name}`} />
            </motion.div>
          </div>
        </Container>
      </section>
    );
  }

  /* ── Centred text-only layout (no image) ── */
  return (
    <section
      id="hero"
      className="relative flex min-h-[88vh] flex-col justify-center py-20 sm:min-h-[85vh] sm:py-24"
    >
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" aria-hidden />
      <Container className="relative z-10 text-center">{textContent}</Container>
    </section>
  );
}
