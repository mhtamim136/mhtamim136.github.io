import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  BookOpen,
  ChevronRight,
  Clock,
  Code,
  FolderOpen,
  Home,
  IdCard,
  Layers,
  Mail,
  Menu,
  User,
  X,
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { MdEmail } from 'react-icons/md';
import { ThemeToggle } from './ThemeToggle';
import { useHideOnScroll } from '../hooks/useHideOnScroll';
import { portfolio } from '../data/portfolio';
import { externalLinkProps } from '../utils/links';

const NAV_ICONS = {
  home: Home,
  user: User,
  code: Code,
  /** Projects — folder represents grouped work clearly */
  folder: FolderOpen,
  /** Research — open book for papers/publications */
  book: BookOpen,
  timeline: Clock,
  layers: Layers,
  mail: Mail,
};

const iconProps = {
  /* `relative` so the icon paints above the travelling pill (anim
     #5): both are positioned at z-auto, so DOM order decides and
     the icon — rendered after the pill — wins. */
  className: 'relative h-5 w-5 shrink-0 transition-colors duration-300 ease-out',
  strokeWidth: 1.5,
};

const navItemBase =
  'relative flex shrink-0 items-center justify-center rounded-xl p-3 transition-all duration-300 ease-out sm:p-3';

/** Hover: subtle lift, soft translucent pill — glass-friendly.
    The look lives in index.css (.nav-item-hover), gated to
    hover-capable devices: on touch :hover sticks on the tapped
    link until the next tap, and the stuck hover pill (bg 0.06 +
    accent) is near-identical to the travelling active pill, so it
    read as a second highlight next to the spy-driven pill. */
const navItemHover = 'nav-item-hover';

/** Active section: visible translucent pill in both themes.
    Round 4: the ring + inset top highlight are a touch stronger
    (0.08 → 0.10) to match the Liquid Glass rim language. */
const navItemActive =
  'bg-glass/[0.07] text-accent ring-1 ring-glass/[0.10] shadow-[inset_0_1px_0_0_rgb(var(--glass)_/_0.10)]';

/** The travelling pill (anim #5): the active background + ring,
    carried by the motion.span behind the active link. The link
    itself keeps only the text colour (`text-accent`). Same round-4
    rim strengthening as navItemActive. */
const navPill =
  'bg-glass/[0.07] ring-1 ring-glass/[0.10] shadow-[inset_0_1px_0_0_rgb(var(--glass)_/_0.10)]';

const navItemIdle = 'text-muted-dim';

/* Profile Card — Tamim's standalone profile-card page, verified
   live (https://mhtamim136.github.io/profile-card/). It is not in
   portfolio.contacts, so the URL is a constant, not a contact key. */
const PROFILE_CARD_URL = 'https://mhtamim136.github.io/profile-card/';

/* Overlay footer socials — mirrors Footer's curated list (GitHub,
   X, email) plus the Profile Card button; no LinkedIn — Tamim
   has none. Missing keys are skipped, never rendered as dead
   links. */
const overlaySocials = [
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
  {
    key: 'profile-card',
    label: 'Profile Card',
    Icon: IdCard,
    getHref: () => PROFILE_CARD_URL,
    external: true,
  },
];

/**
 * Instant tooltips, icon-only pill (no text labels — they would widen
 * the pill). The tooltip lives on the <header>, outside the scrolling
 * <nav>, so it is never clipped by the nav's overflow, and it appears
 * the moment the pointer arrives — unlike the native `title` tooltip,
 * which takes ~1s. Positioned under the hovered icon, clamped inside
 * the viewport. A tap clears it, so it never lingers on touch screens.
 *
 * Mobile (below sm, 640px): the pill holds only two controls — a
 * menu button and the theme toggle. Tapping the menu button opens a
 * full-screen overlay with the 8 sections as large numbered text
 * rows, so nothing is ever squeezed or cut off the way 8×44px of
 * icons + toggle were at 390px (421px needed vs 382px available —
 * the old pill scrolled horizontally to cope). The overlay is
 * portalled to document.body (same pattern as PhotoLightbox), not
 * rendered inside the header: the header carries a transform
 * (hide-on-scroll), and any transform makes fixed descendants
 * position against it instead of the viewport. Desktop (sm and up)
 * is exactly as before — the 8 icon links, the travelling pill
 * (anim #5) and the tooltips are untouched. overflow-x-auto stays
 * on the pill only as a safety net for narrower screens.
 */
export function Navbar({ items, activeId, isDark, onThemeToggle }) {
  const [tip, setTip] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const overlayRef = useRef(null);
  /* Tracks whether the menu was open, so focus returns to the menu
     button only after a real close — never on first mount. */
  const wasOpenRef = useRef(false);
  /* Reduced motion: the travelling pill is disabled — the static
     class pill (navItemActive) renders instead, exactly as before
     (anim #5). MotionConfig would disable the layout animation
     anyway; this gate is explicit. */
  const reduceMotion = useReducedMotion() ?? false;
  /* Smart navigation — hide on scroll down, show on any scroll
     up, always visible at the top. Transform only; see
     useHideOnScroll for the hysteresis design. While the mobile
     menu is open the bar must stay put: the overlay carries its
     own pill, and hiding the header under it would strand focus
     on a control the user can no longer see. */
  const scrollHidden = useHideOnScroll();
  const hidden = scrollHidden && !menuOpen;

  /* A tooltip left open must not linger while the bar is away. */
  useEffect(() => {
    if (hidden) setTip(null);
  }, [hidden]);

  /* Mobile menu: Escape closes it, the page behind never scrolls,
     and the menu closes itself if the viewport grows to desktop —
     the overlay is sm:hidden, so without this the scroll lock and
     the focus would stay trapped inside a hidden menu. */
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    const media = window.matchMedia('(min-width: 640px)');
    const onViewportChange = (e) => {
      if (e.matches) setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    media.addEventListener('change', onViewportChange);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      media.removeEventListener('change', onViewportChange);
      document.body.style.overflow = prevOverflow;
    };
  }, [menuOpen]);

  /* Focus: into the overlay on open, back to the menu button on
     close. The overlay is tabIndex={-1} so focusing it never
     adds a tab stop. */
  useEffect(() => {
    if (menuOpen) {
      overlayRef.current?.focus();
      wasOpenRef.current = true;
    } else if (wasOpenRef.current) {
      menuButtonRef.current?.focus();
      wasOpenRef.current = false;
    }
  }, [menuOpen]);

  const showTip = (e, label) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.max(56, Math.min(window.innerWidth - 56, r.left + r.width / 2));
    setTip({ label, x });
  };
  const hideTip = () => setTip(null);

  const openMenu = () => {
    hideTip();
    setMenuOpen(true);
  };
  const closeMenu = () => setMenuOpen(false);

  return (
    <header
      className={`pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-2 pt-3 transition-[transform,visibility] duration-300 ease-out sm:px-6 sm:pt-4 ${
        hidden ? '-translate-y-[calc(100%+1rem)] invisible' : 'translate-y-0'
      }`}
    >
      {/* Hide: the bar slides up out of view (transform only, so
          no layout shift). `invisible` flips at the END of the
          slide — and instantly on the way back — so the links also
          leave the tab order while hidden, and the frosted-glass
          shadow can never leave a faint trace at the top edge.
          Under reduced motion the site's global rule collapses
          the transition to 0.01ms, so hide/show becomes instant
          instead of sliding. */}
      {/* Desktop Liquid Glass (round 4): `nav-glass-desktop` layers
          the overlay's glass material (24px blur + sheen + rim) on
          top of .nav-glass — scoped to sm+ in index.css, so the
          mobile closed pill and overlay top pill stay untouched.
          `relative` anchors the sheen ::before; it changes no
          layout (no offsets) and no geometry. */}
      <nav
        className="pointer-events-auto nav-glass nav-glass-desktop relative flex max-w-6xl items-center justify-safe-center gap-0 overflow-x-auto rounded-[1.125rem] px-1 py-2 sm:gap-2 sm:px-3 sm:py-2.5"
        aria-label="Primary"
      >
        {/* Mobile menu button — below sm the pill holds only this
            and the theme toggle; the 8 links live in the overlay. */}
        <button
          ref={menuButtonRef}
          type="button"
          onClick={openMenu}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-menu"
          className={`${navItemBase} ${navItemIdle} ${navItemHover} sm:hidden`}
        >
          <Menu {...iconProps} aria-hidden />
          <span className="sr-only">Menu</span>
        </button>

        {/* Desktop links — display:contents at sm+ keeps them flex
            children of the pill exactly as before; hidden below sm
            so they never take tab stops on mobile. */}
        <div className="hidden sm:contents">
          {items.map(({ id, label, icon }) => {
            const active = activeId === id;
            const Icon = NAV_ICONS[icon] ?? Home;
            return (
              <a
                key={id}
                href={`#${id}`}
                aria-current={active ? 'page' : undefined}
                onMouseEnter={(e) => showTip(e, label)}
                onMouseLeave={hideTip}
                onFocus={(e) => showTip(e, label)}
                onBlur={hideTip}
                onClick={hideTip}
                className={`${navItemBase} ${active ? (reduceMotion ? navItemActive : 'text-accent') : navItemIdle} ${navItemHover}`}
              >
                {/* Travelling active pill (anim #5): a layoutId span
                    behind the active link — it slides between icons
                    (spring 300/30) instead of fading in place. It
                    renders only for the active link and only when
                    motion is allowed; under reduced motion the link
                    keeps the static navItemActive pill as before.
                    `absolute inset-0` anchors to the link (relative
                    via navItemBase); the icon paints above it (also
                    relative, later in DOM). The travel is a transform,
                    so the nav's overflow-x-auto clip still applies
                    and the pill can never paint outside the pill. */}
                {active && !reduceMotion && (
                  <motion.span
                    layoutId="nav-pill"
                    className={`absolute inset-0 rounded-xl ${navPill}`}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    aria-hidden
                  />
                )}
                <Icon {...iconProps} aria-hidden />
                <span className="sr-only">{label}</span>
              </a>
            );
          })}
        </div>

        {/* Divider */}
        <div className="mx-1 h-6 w-px shrink-0 bg-glass/[0.1]" aria-hidden />

        {/* Theme toggle */}
        <div
          className="shrink-0"
          onMouseEnter={(e) => showTip(e, isDark ? 'Light mode' : 'Dark mode')}
          onMouseLeave={hideTip}
          onFocus={(e) => showTip(e, isDark ? 'Light mode' : 'Dark mode')}
          onBlur={hideTip}
          onClick={hideTip}
        >
          <ThemeToggle isDark={isDark} onToggle={onThemeToggle} />
        </div>
      </nav>

      {/* Instant tooltip, below the pill, under the hovered icon */}
      {tip && (
        <span
          aria-hidden
          style={{ left: tip.x }}
          className="pointer-events-none absolute top-full z-50 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-card px-2.5 py-1 text-xs font-medium text-heading shadow-lg ring-1 ring-glass/10"
        >
          {tip.label}
        </span>
      )}

      {/* Mobile full-screen menu — portalled to document.body (see
          the note above: the header's transform would trap a fixed
          child). Opens with a short fade; under reduced motion it
          appears instantly — initial={false} + a 0-duration
          transition, gated here explicitly rather than through
          MotionConfig alone.

          Liquid Glass (round 2): the round-1 bg-surface/80 was
          80% opaque, so the page behind never showed — on a real
          phone it read as a flat sheet, not glass. The overlay is
          now a light tint only (bg-surface/30) over a heavy frost
          (blur 24px + saturate 150% + brightness 1.05), so the
          hero/projects bleed through blurred and colour-shifted,
          the way iOS 26 Control Center lets the wallpaper show
          through. A soft top sheen (the --nav-highlight white)
          and the inset rim on the rows sell the wet-glass edge.
          Text stays legible because the labels sit on their own
          glass chips, not on the bare backdrop. */}
      {menuOpen &&
        createPortal(
          <motion.div
            ref={overlayRef}
            id="mobile-nav-menu"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 z-[60] flex flex-col bg-surface/30 backdrop-blur-xl backdrop-saturate-150 backdrop-brightness-105 sm:hidden"
          >
            {/* Liquid-glass sheen — soft top light (the same white
                the --nav-highlight rim uses) fading out by a third
                of the screen. It paints above the blurred backdrop
                and below the menu content, so the glass reads wet
                at the top edge. pointer-events-none: it never
                blocks a tap. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0)_32%)]"
            />

            {/* Top pill — same glass, same position as the header
                pill: X on the left, theme toggle on the right. */}
            <div className="flex justify-center px-2 pt-3">
              <div className="nav-glass flex items-center gap-0 rounded-[1.125rem] px-1 py-2">
                <button
                  type="button"
                  onClick={closeMenu}
                  aria-label="Close menu"
                  className={`${navItemBase} ${navItemIdle} ${navItemHover}`}
                >
                  <X {...iconProps} aria-hidden />
                  <span className="sr-only">Close</span>
                </button>
                <div className="mx-1 h-6 w-px shrink-0 bg-glass/[0.1]" aria-hidden />
                <div className="shrink-0">
                  <ThemeToggle isDark={isDark} onToggle={onThemeToggle} />
                </div>
              </div>
            </div>

            {/* Modern rows — reuse the items prop, never a hardcoded
                list. A tap navigates (same hash links as the desktop
                pill) and closes the menu. Each row is a liquid-glass
                chip: translucent glass tint + its own blur/saturate
                + an inset top rim, so the rows read as glass slabs
                floating over the frosted page — not flat fills. The
                icon sits in a small glass tile, the number stays
                for the numbered-list feel, and a chevron marks the
                row as a link; the active row keeps the accent glass
                and its label takes the site's cyan → emerald text
                gradient, and the icon tile turns accent too. The
                travelling pill (anim #5) stays a desktop-only
                treatment. active:scale gives a pressed feel on
                tap; justify-safe-center keeps the first row
                reachable if the list ever scrolls on a short
                screen.

                Compact sizing (round 3): each row is 54px tall —
                36px icon tile + py-2 + 1px borders — instead of
                70px. The whole list (8 rows + gaps + nav padding)
                is 520px, so it fits without scrolling even at
                360x740 (522px available) while the footer keeps
                its pt-6 gap; at taller heights the leftover space
                centers via justify-safe-center, so the name gap
                grows (see REPORT.md). The rows stay generous tap
                targets (54px, full-width) and the structure,
                glass, and gradient are unchanged. */}
            <nav
              className="flex flex-1 flex-col justify-safe-center gap-2 overflow-y-auto px-5 py-4"
              aria-label="Mobile"
            >
              {items.map(({ id, label, icon }, i) => {
                const active = activeId === id;
                const Icon = NAV_ICONS[icon] ?? Home;
                return (
                  <a
                    key={id}
                    href={`#${id}`}
                    aria-current={active ? 'page' : undefined}
                    onClick={closeMenu}
                    className={`flex items-center gap-3 rounded-2xl border px-3 py-2 font-display backdrop-blur-md backdrop-saturate-150 transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                      active
                        ? 'border-accent/35 bg-accent/10 shadow-[inset_0_1px_0_0_rgb(var(--accent)_/_0.25)]'
                        : 'border-glass/10 bg-glass/[0.07] text-heading shadow-[inset_0_1px_0_0_rgb(var(--glass)_/_0.10)] hover:border-accent/35 hover:bg-accent/10 hover:text-accent'
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-[inset_0_1px_0_0_rgb(var(--glass)_/_0.10)] ${
                        active
                          ? 'border-accent/35 bg-accent/15 text-accent'
                          : 'border-glass/10 bg-glass/[0.06] text-muted'
                      }`}
                      aria-hidden
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                    </span>
                    <span
                      className={`text-sm font-medium tabular-nums ${
                        active ? 'text-accent' : 'text-muted-dim'
                      }`}
                      aria-hidden
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span
                      className={`flex-1 text-left text-2xl font-semibold tracking-tight ${
                        active ? 'text-gradient' : ''
                      }`}
                    >
                      {label}
                    </span>
                    <ChevronRight
                      className={`h-5 w-5 shrink-0 ${active ? 'text-accent' : 'text-muted-dim'}`}
                      aria-hidden
                    />
                  </a>
                );
              })}
            </nav>

            {/* Footer — name + curated socials (GitHub, X, email, Profile Card).
                pt-6 above the name: round 2's name sat only ~10px below
                the Contact row (the rows list already overflowed by
                ~14px at 844px, so the nav's 24px bottom padding was
                mostly below the fold). The extra 24px doubles the
                breathing room — but only because the rows below are
                compact enough that the list no longer overflows. */}
            <div className="flex flex-col items-center gap-4 px-6 pb-10 pt-6">
              <p className="text-sm text-muted">{portfolio.name}</p>
              <div className="flex items-center gap-3">
                {overlaySocials.map(({ key, label, Icon, getHref, external }) => {
                  const href = getHref(portfolio.contacts);
                  if (!href) return null;
                  const linkProps = external ? externalLinkProps(href) : { href };
                  return (
                    <a
                      key={key}
                      {...linkProps}
                      aria-label={label}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-glass/10 bg-glass/[0.04] text-muted transition-all duration-300 hover:border-accent/35 hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                    >
                      <Icon className="h-[18px] w-[18px]" aria-hidden />
                    </a>
                  );
                })}
              </div>
            </div>
          </motion.div>,
          document.body
        )}
    </header>
  );
}
