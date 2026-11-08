import { motion, useReducedMotion } from 'framer-motion';
import { portfolio } from '../data/portfolio';
import { Container } from '../components/Container';
import { Button } from '../components/Button';
import { Magnetic } from '../components/Magnetic';
import { Tag } from '../components/Tag';
import { Avatar } from '../components/Avatar';
import { RoleLine } from '../components/RoleLine';
import { BlurWords } from '../components/BlurWords';
import { NavIcon } from '../components/icons/NavIcons';
import { externalLinkProps } from '../utils/links';
import { useProfileImage } from '../hooks/useProfileImage';
import heroManifest from 'virtual:hero-image-manifest';

/**
 * One shared entrance for the whole hero (Direction A): rise + fade
 * on a spring (stiffness 260 / damping 26). Every element uses the
 * same physics, so the hero arrives as a single sequence instead of
 * competing fades. The name/title words use BlurWords — the same
 * spring plus a blur(8px)→0 focus pull — and the photo enters on
 * its own plane with a clip-path wipe + scale 1.06→1, concurrent
 * with the name, which is what gives the two-plane depth.
 *
 * Sequence (delays in seconds, spring settles ≈ 0.3s after delay):
 *   location 0.00 · name 0.05/0.12/0.19 · role 0.24 · underline 0.30
 *   username 0.33 · title 0.38/0.45/0.52/0.59 · bio 0.58
 *   skills 0.64 · CTAs 0.70 → whole hero settled ≈ 1.0s, then still.
 * Photo wipe starts at 0.05 and runs 0.8s, so it lands with the name.
 *
 * Reduced motion: <MotionConfig reducedMotion="user"> disables
 * transform/layout animations, but NOT opacity — so every motion
 * element here also gets initial={false} under reduced motion and
 * renders in its final state instantly. BlurWords and the photo
 * wipe gate themselves the same way (see those files).
 */
const SPRING = { type: 'spring', stiffness: 260, damping: 26 };

const rise = {
  hidden: { opacity: 0, y: 24 },
  show: (delay) => ({
    opacity: 1,
    y: 0,
    transition: { ...SPRING, delay },
  }),
};

export function HeroSection() {
  const { name, username, title, bio, highlightedSkills, resumeLink, githubProfile } = portfolio;
  const profileImage = useProfileImage();
  const hasImage = Boolean(heroManifest || profileImage);
  const reduceMotion = useReducedMotion() ?? false;
  /* Under reduced motion every element renders in its final state
     instantly — no rise, no fade, no wipe, no blur (see note above). */
  const initial = reduceMotion ? false : 'hidden';

  /* ── Blur + rise words — name (3 words) then title (4 words)
      as one continuous stagger. The last name word keeps its
      gradient; the title words are plain. ── */
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
        variants={rise}
        initial={initial}
        animate="show"
        className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-accent/65 sm:text-sm"
      >
        {portfolio.location}
      </motion.p>

      {/* Name — blur + rise, word by word. The focus pull IS the
          entrance: no mask, no opacity-only fade. */}
      <h1 className="font-display text-4xl font-bold tracking-tight text-heading sm:text-5xl lg:text-6xl">
        <BlurWords words={nameWords} baseDelay={0.05} />
      </h1>

      {/* Rotating role line — min-h keeps the swap from moving the
          layout below it. Placed under the name, before the username. */}
      <motion.p
        custom={0.24}
        variants={rise}
        initial={initial}
        animate="show"
        className="mt-3 min-h-[1.75rem] font-mono text-base font-medium text-accent sm:text-lg"
      >
        <RoleLine />
      </motion.p>

      {/* One thin accent only: a gradient underline that draws in
          once, as part of the entrance, then stays static. It is a
          sibling of RoleLine — NOT inside its AnimatePresence — so
          it never redraws when the role swaps. */}
      <motion.div
        initial={reduceMotion ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.3, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: 'left' }}
        className={`mt-2 h-[2px] w-16 rounded-full bg-gradient-to-r from-accent via-[var(--gradient-via)] to-[var(--gradient-to)] ${
          hasImage ? 'mx-auto lg:mx-0' : 'mx-auto'
        }`}
        aria-hidden
      />

      <motion.p
        custom={0.33}
        variants={rise}
        initial={initial}
        animate="show"
        className="mt-3 font-mono text-base font-semibold tracking-tight text-accent sm:text-lg"
      >
        {username}
      </motion.p>

      {/* Title — blur + rise, continuing the same stagger as the
          name (baseDelay 0.38). RoleLine above is untouched. */}
      <p className={`mt-4 text-lg font-semibold text-body sm:text-xl ${hasImage ? '' : 'mx-auto max-w-xl'}`}>
        <BlurWords words={titleWords} baseDelay={0.38} />
      </p>

      <motion.p
        custom={0.58}
        variants={rise}
        initial={initial}
        animate="show"
        className={`mt-4 text-sm leading-relaxed text-muted sm:text-base ${hasImage ? 'max-w-lg' : 'mx-auto max-w-2xl'}`}
      >
        {bio}
      </motion.p>

      <motion.div
        custom={0.64}
        variants={rise}
        initial={initial}
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
        custom={0.7}
        variants={rise}
        initial={initial}
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

            {/* Image — right on desktop, top on mobile. Enters on
                its own plane: a top-down clip-path wipe + a gentle
                1.06→1 settle, concurrent with the name's focus pull
                — the photo plane and the text plane arriving together
                is the two-plane depth. The photo column already
                spans the name's baseline vertically, so no extra
                positional offset is needed for the overlap. */}
            <motion.div
              className="w-48 shrink-0 sm:w-56 lg:w-64 xl:w-72"
              initial={reduceMotion ? false : { clipPath: 'inset(0 0 100% 0)', scale: 1.06 }}
              animate={{ clipPath: 'inset(0 0 0% 0)', scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
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
