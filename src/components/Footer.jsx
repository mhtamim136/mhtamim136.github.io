import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { FaGithub } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { MdEmail } from 'react-icons/md';
import { portfolio } from '../data/portfolio';
import { Container } from './Container';
import { Button } from './Button';
import { Magnetic } from './Magnetic';
import { BlurWords } from './BlurWords';
import { NavIcon } from './icons/NavIcons';
import { externalLinkProps } from '../utils/links';
import '../sections/HeroCtaFill.css';

/**
 * Page footer — the closing CTA (§A Footer CTA item).
 *
 * Closing statement "Let's build something together" + the deliberate
 * repeat of "Open to internships & collaboration" (same wording as
 * the hero) + one Magnetic "Get In Touch" → #contact + a curated
 * bottom bar (GitHub, X, email only; the full list lives in Contact).
 * Full duplicate/build rationale: README "Footer CTA rationale".
 * Entrance is a single fade + 8px rise, gated with useReducedMotion
 * so under reduced motion the footer renders in its final state
 * instantly (MotionConfig stops transforms, not opacity — the
 * explicit gate is required, same pattern HeroSection uses).
 * The closing statement itself gets the hero's BlurWords reveal
 * (anim #3): it arrives word by word when the footer scrolls into
 * view, bookending the opening name.
 */

/* Closing statement words for the BlurWords reveal (anim #3) —
   the same words as the plain h2 it replaces, gradient kept on
   "together". The apostrophe is the literal ’ (U+2019), as
   rendered by the old `Let&rsquo;s`. */
const statementWords = [
  { text: 'Let’s' },
  { text: 'build' },
  { text: 'something' },
  { text: 'together', className: 'text-gradient' },
];

/* Curated professional identities only. Missing keys are skipped,
   never rendered as dead links. */
const socials = [
  {
    key: 'github',
    label: 'GitHub profile',
    Icon: FaGithub,
    getHref: (c) => c.github,
    external: true,
  },
  {
    key: 'x',
    label: 'X (Twitter) profile',
    Icon: FaXTwitter,
    getHref: (c) => c.x,
    external: true,
  },
  {
    key: 'email',
    label: 'Send an email',
    Icon: MdEmail,
    getHref: (c) => (c.email ? `mailto:${c.email}` : undefined),
    external: false,
  },
];

export function Footer() {
  const { contacts } = portfolio;
  const reduceMotion = useReducedMotion() ?? false;
  /* Word-reveal trigger (anim #3): mount BlurWords only once the
     statement has scrolled into view (same -40px margin as the
     section entrance), so the animation never plays unseen below
     the fold. Before that the identical plain text renders, so
     the heading keeps its layout. */
  const statementRef = useRef(null);
  const statementInView = useInView(statementRef, { once: true, margin: '-40px' });

  return (
    <footer className="relative border-t border-glass/[0.06]">
      {/* Faint hero-glow echo behind the CTA — ties the closing
          statement to the opening hero. Existing utility only. In
          light mode the `footer-glow` marker (see index.css) swaps
          it for a soft sky → emerald band. */}
      <div
        className="footer-glow pointer-events-none absolute inset-x-0 top-0 h-80 bg-hero-glow"
        aria-hidden
      />

      <Container className="relative">
        {/* ── Closing CTA ── */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="py-16 text-center sm:py-20 lg:py-24"
        >
          <h2
            ref={statementRef}
            className="font-display text-4xl font-bold tracking-tight leading-[1.15] text-heading sm:text-5xl lg:text-6xl"
          >
            {statementInView ? (
              <BlurWords words={statementWords} />
            ) : (
              <>
                Let&rsquo;s build something <span className="text-gradient">together</span>
              </>
            )}
          </h2>
          <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.18em] text-accent/65 sm:text-xs">
            Open to internships &amp; collaboration
          </p>
          <div className="mt-8 flex justify-center">
            <Magnetic>
              {/* Same 550ms L-to-R wipe as the hero primary (Tier 4,
                  item 21): the footer CTA bookends the page with the
                  hero. Still a plain link to #contact. */}
              <Button
                href="#contact"
                variant="primary"
                className="hero-cta-fill hero-cta-fill--solid"
              >
                Get In Touch
                <span
                  aria-hidden
                  className="transition-transform duration-250 group-hover:translate-x-[3px] motion-reduce:group-hover:translate-x-0"
                >
                  <NavIcon name="arrow-right" className="h-4 w-4" />
                </span>
              </Button>
            </Magnetic>
          </div>
        </motion.div>

        {/* ── Bottom bar: curated socials + unchanged copyright ── */}
        <div className="flex flex-col items-center gap-4 border-t border-glass/[0.06] py-6 sm:flex-row sm:justify-between sm:py-8">
          <div className="flex items-center gap-2">
            {socials.map(({ key, label, Icon, getHref, external }) => {
              const href = getHref(contacts);
              if (!href) return null;
              const linkProps = external ? externalLinkProps(href) : { href };
              /* Tier 4, item 22(b): quick cyan fill — the same wipe
                 as the primary CTAs, but --ghost (resting glass
                 untouched) at 220ms (--quick) instead of 550ms,
                 because a slow sweep feels mushy on a 44px target.
                 Icon flips to #062A33 with the fill. No full 550ms
                 wipe here: these stay secondary to the CTAs. */
              return (
                <a
                  key={key}
                  {...linkProps}
                  aria-label={label}
                  title={label}
                  className="hero-cta-fill hero-cta-fill--ghost hero-cta-fill--quick flex h-11 w-11 items-center justify-center rounded-xl border border-glass/10 bg-glass/[0.04] text-muted transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/35 hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                </a>
              );
            })}
          </div>
          <p className="text-center text-xs text-muted-dim">
            © {new Date().getFullYear()} {portfolio.name}. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
