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
import './HeroCtaFill.css';
import heroManifest from 'virtual:hero-image-manifest';

/**
 * One shared entrance for the whole hero (Direction A): rise + fade
 * on a spring (stiffness 260 / damping 26). Every element uses the
 * same physics, so the hero arrives as a single sequence instead of
 * competing fades. The name/title words use BlurWords — the same
 * spring plus a blur(8px)→0 focus pull.
 *
 * The photo is NOT part of that spring: it keeps the previous
 * design — a gentle fade + 20px rise (0.4s) on the wrapper, plus
 * the Avatar's own 0.85→1 scale-in. Direction A gave it a clip-path
 * wipe + 1.06→1 scale, which made the photo look cut on all four
 * sides (the 1.06 scale enlarged the circle past its frame while
 * the wipe hid its lower part), so the photo entrance was reverted
 * to the previous design and nothing else changed.
 *
 * Sequence (delays in seconds, spring settles ≈ 0.3s after delay):
 *   meta labels 0.00 · name 0.05/0.12/0.19 · role 0.24 · underline 0.30
 *   username 0.33 · title 0.38/0.45/0.52/0.59 · bio 0.58
 *   skills 0.64 · CTAs 0.70 → whole hero settled ≈ 1.0s, then still.
 *
 * Reduced motion: <MotionConfig reducedMotion="user"> disables
 * transform/layout animations, but NOT opacity — so every motion
 * element here also gets initial={false} under reduced motion and
 * renders in its final state instantly. BlurWords gates itself the
 * same way (see that file).
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

/* Pre-Direction-A photo entrance (restored): the photo wrapper
   fades + rises 20px in 0.4s — the previous design. Kept separate
   from `rise` on purpose: the photo is not part of the Direction A
   spring sequence. */
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
      {/* Meta-label row (Direction C, part 1) — quiet editorial
          metadata above the name, at most 3 labels, all facts
          already on the site: location, the approved availability
          wording, and the folio year. Same `rise` spring at delay
          0.00 as the old location line it replaces — no competing
          animation. Small caps, wide tracking, muted accent; no
          glow, no bright colour, no pills. Each label + its
          trailing dot is one nowrap unit, so the row wraps cleanly
          at unit boundaries on mobile and never orphans a dot. */}
      <motion.p
        custom={0}
        variants={rise}
        initial={initial}
        animate="show"
        className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-accent/65 sm:text-xs"
      >
        <span className="whitespace-nowrap">
          {portfolio.location}{' '}
          <span aria-hidden className="text-accent/40">
            ·
          </span>
        </span>{' '}
        <span className="whitespace-nowrap">
          Open to internships &amp; collaboration{' '}
          <span aria-hidden className="text-accent/40">
            ·
          </span>
        </span>{' '}
        <span className="whitespace-nowrap">Folio {new Date().getFullYear()}</span>
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
      <p
        className={`mt-4 text-lg font-semibold text-body sm:text-xl ${hasImage ? '' : 'mx-auto max-w-xl'}`}
      >
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
        className={`mt-10 flex flex-wrap gap-4 ${
          hasImage ? 'justify-center lg:justify-start' : 'items-center justify-center'
        }`}
      >
        {/* Hero CTAs — magnetic (lean toward the pointer, capped
            so neighbours can never overlap; see Magnetic.jsx).
            Mobile centring: on small screens the hero text is
            centred, so the row is centred too — the GitHub icon
            wraps to a second row at 390px and below, and centred
            it reads as a deliberate second row (left-aligned it
            read as an orphaned leftover). Desktop keeps the left
            alignment that matches the left-aligned text.
            Order is the hierarchy: Contact first (primary), Resume
            second, GitHub icon-only last. The Contact label is
            "Get In Touch" (Tamim's pick — "Let's Work Together" was
            too long on mobile; this is the professional standard,
            Brittany Chiang's exact label); its arrow nudges 3px on
            hover — the pattern borrowed from Chiang's "Get In Touch"
            hero CTA (single most prominent action) and Snellenberg's
            arrow-led "Get in touch" pill, restyled in this site's
            own Button language (accent tint + border + glow), not
            copied. Resume opens in a NEW TAB (no `download`) so the
            visitor stays on the site; GitHub is icon-only at the
            same height/padding as its siblings, with aria-label +
            title so it stays discoverable. */}
        <Magnetic>
          {/* hero-cta-fill: slow left-to-right cyan wipe on hover /
              focus-visible — all three hero buttons share it
              (see HeroCtaFill.css). --solid keeps the primary's
              resting tint; --ghost keeps the secondary's glass, so
              the resting hierarchy stays distinct. Tier 4, item 21:
              the Footer "Get In Touch" CTA and the Contact "Send
              message" button reuse the same --solid wipe; Tier 4,
              item 22: the footer icon buttons reuse it --ghost at
              220ms. */}
          <Button href="#contact" variant="primary" className="hero-cta-fill hero-cta-fill--solid">
            Get In Touch
            <span
              aria-hidden
              className="transition-transform duration-250 group-hover:translate-x-[3px] motion-reduce:group-hover:translate-x-0"
            >
              <NavIcon name="arrow-right" className="h-4 w-4" />
            </span>
          </Button>
        </Magnetic>
        <Magnetic>
          <Button
            {...externalLinkProps(resumeLink)}
            variant="secondary"
            className="hero-cta-fill hero-cta-fill--ghost"
          >
            <NavIcon name="document" className="h-4 w-4" />
            Resume
          </Button>
        </Magnetic>
        <Magnetic>
          <Button
            {...externalLinkProps(githubProfile)}
            variant="secondary"
            className="hero-cta-fill hero-cta-fill--ghost"
            aria-label="View GitHub profile"
            title="View GitHub profile"
          >
            <NavIcon name="github" className="h-4 w-4" />
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

            {/* Image — right on desktop, top on mobile. Previous
                design restored: a gentle fade + 20px rise (0.4s) on
                the wrapper, plus the Avatar's own 0.85→1 scale-in.
                The photo always grows INTO its frame, never past
                it, so it can never look cut. No wipe, no 1.06 scale. */}
            <motion.div
              className="w-48 shrink-0 sm:w-56 lg:w-64 xl:w-72"
              custom={0}
              variants={item}
              initial={reduceMotion ? false : 'hidden'}
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
