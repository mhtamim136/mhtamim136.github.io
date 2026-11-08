import { motion, useReducedMotion } from 'framer-motion';
import { FaGithub } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { MdEmail } from 'react-icons/md';
import { portfolio } from '../data/portfolio';
import { Container } from './Container';
import { Button } from './Button';
import { Magnetic } from './Magnetic';
import { NavIcon } from './icons/NavIcons';
import { externalLinkProps } from '../utils/links';

/**
 * Page footer — the closing CTA (§A Footer CTA item).
 *
 * ── THINK FIRST: duplicate re-check (verified against live code
 *    at base cf20b9da, before this component was written) ──
 *  1. "Let's build something together" — NOWHERE on the site.
 *     Hero has name/title/bio; Contact's title is "Contact" and
 *     its subtitle is "Open to collaboration, project work, and
 *     new opportunities." No closing statement exists anywhere.
 *     → NEW, no duplicate.
 *  2. Availability "Open to internships & collaboration" — ALREADY
 *     in the hero meta-label row (HeroSection.jsx). Repeating it
 *     here is the DELIBERATE closing repetition (hero = main CTA,
 *     footer = final CTA), in the EXACT same wording, so there is
 *     no second phrasing to drift. This is the one intentional
 *     repeat — an availability status belongs at the close.
 *  3. "Get In Touch" button → #contact — ALREADY the hero primary
 *     CTA (same label, same target). Repeating the SAME button at
 *     the bottom is the point of a closing CTA (the Dennis
 *     Snellenberg pattern: the footer IS the CTA). It is a link
 *     to the existing Contact section, NOT a second contact
 *     channel — no form, no second email, no second anything.
 *  4. Email address display — ALREADY in Contact (email card,
 *     mailto link). The footer shows NO email text, only a
 *     mailto icon in the bottom bar. → no duplicate display.
 *  5. Copy-email button — NOT built. It belongs to the pending
 *     Contact Micro-interactions item, not the footer.
 *  6. Social links — Contact has all 6 (GitHub, Profile Card, X,
 *     Instagram, Facebook, Discord). The footer shows a CURATED
 *     3 only: GitHub, X, email. Facebook / Instagram / Discord
 *     are personal — they stay in Contact only. The GitHub/X/
 *     email repeat is intentional curation (professional
 *     identities in the footer, full list in Contact), not a
 *     copy of the Socials card.
 *  7. Back to top — <ScrollToTop /> ALREADY EXISTS (App.jsx).
 *     NO second one is built.
 *  8. Copyright — ALREADY EXISTS, dynamic year. Kept
 *     byte-identical, moved into the bottom bar.
 *  9. Contact form — stays in Contact only. No form here.
 * 10. LinkedIn — contacts has NO linkedin key. NOT added.
 *
 * ── Build vs not build ──
 *  Build: the page gets a proper close. A visitor who scrolls
 *  past Contact (or lands at the bottom) sees one final,
 *  unmissable invitation plus the professional identities. Cost:
 *  one component + one small App.jsx edit, no new deps, no new
 *  data. The duplicate risk is contained by the check above.
 *  Don't build: the footer stays a bare copyright line — the
 *  "missed opportunity" the other AI named is real (verified:
 *  the footer IS only copyright). The page ends abruptly after
 *  Contact with no closing gesture. Nothing breaks, but the
 *  bottom of the site feels unfinished.
 *
 * ── Design ──
 *  CTA block: giant heading in the display font at hero-name
 *  scale (4xl/5xl/6xl), "together" in the site's gradient — the
 *  same last-word-gradient echo as the hero name. Availability
 *  line in the hero meta-label language (small caps, wide
 *  tracking, muted accent). ONE Magnetic primary button,
 *  "Get In Touch" → #contact, with the hero's 3px arrow nudge.
 *  A faint bg-hero-glow echo (the existing 10%-accent radial
 *  the hero uses) ties the close to the opening — no new
 *  gradient, no extra layer.
 *  Bottom bar: curated socials (icon-only, 40px targets, same
 *  hover language as SocialButton) + the unchanged copyright.
 *
 * ── Reduced motion ──
 *  The entrance is a single fade + 16px rise (whileInView,
 *  once). It is gated with useReducedMotion → initial={false},
 *  so under reduced motion the footer renders in its final
 *  state instantly. (The global <MotionConfig
 *  reducedMotion="user"> disables transform/layout animations
 *  but NOT opacity, so the explicit gate is required — the
 *  same pattern HeroSection uses.) Magnetic self-gates on
 *  reduced motion + coarse pointer, so the button is inert
 *  there too. Zero movement under reduced motion.
 */

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

  return (
    <footer className="relative border-t border-glass/[0.06]">
      {/* Faint hero-glow echo behind the CTA — ties the closing
          statement to the opening hero. Existing utility only. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-hero-glow" aria-hidden />

      <Container className="relative">
        {/* ── Closing CTA ── */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="py-16 text-center sm:py-20 lg:py-24"
        >
          <h2 className="font-display text-4xl font-bold tracking-tight text-heading sm:text-5xl lg:text-6xl">
            Let&rsquo;s build something <span className="text-gradient">together</span>
          </h2>
          <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.18em] text-accent/65 sm:text-xs">
            Open to internships &amp; collaboration
          </p>
          <div className="mt-8 flex justify-center">
            <Magnetic>
              <Button href="#contact" variant="primary">
                Get In Touch
                <span aria-hidden className="transition-transform duration-250 group-hover:translate-x-[3px]">
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
              return (
                <a
                  key={key}
                  {...linkProps}
                  aria-label={label}
                  title={label}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-glass/10 bg-glass/[0.04] text-muted transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/35 hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
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
