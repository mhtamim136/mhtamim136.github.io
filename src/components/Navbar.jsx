import { useEffect, useState } from 'react';
import { BookOpen, Clock, Code, FolderOpen, Home, Layers, Mail, User } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useHideOnScroll } from '../hooks/useHideOnScroll';

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
  className: 'h-5 w-5 shrink-0 transition-colors duration-300 ease-out',
  strokeWidth: 1.5,
};

const navItemBase =
  'flex shrink-0 items-center justify-center rounded-xl p-3 transition-all duration-300 ease-out sm:p-3';

/** Hover: subtle lift, soft translucent pill — glass-friendly */
const navItemHover =
  'hover:-translate-y-1 hover:scale-[1.07] hover:bg-glass/[0.06] hover:text-accent motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100';

/** Active section: visible translucent pill in both themes */
const navItemActive =
  'bg-glass/[0.07] text-accent ring-1 ring-glass/[0.08] shadow-[inset_0_1px_0_0_rgb(var(--glass)_/_0.06)]';

const navItemIdle = 'text-muted-dim';

/**
 * Instant tooltips, icon-only pill (no text labels — they would widen
 * the pill). The tooltip lives on the <header>, outside the scrolling
 * <nav>, so it is never clipped by the nav's overflow, and it appears
 * the moment the pointer arrives — unlike the native `title` tooltip,
 * which takes ~1s. Positioned under the hovered icon, clamped inside
 * the viewport. A tap clears it, so it never lingers on touch screens.
 *
 * Mobile (~390px): the icons are 44×44 tap targets (p-3 around
 * the 20px icon), so the gaps shrink to fit: gap-0 between items,
 * px-1 on the pill, px-2 on the header. With eight items the pill
 * no longer fits — 8×44 + divider 17 + toggle 44 + pill padding 8
 * = 421px > 382px available (390 − header px-2) — so it scrolls
 * horizontally (overflow-x-auto). The 44px tap targets stay, so
 * the scroll is the tradeoff for the eighth item; overflow-x-auto
 * remains only as a safety net for narrower screens otherwise.
 */
export function Navbar({ items, activeId, isDark, onThemeToggle }) {
  const [tip, setTip] = useState(null);
  /* Smart navigation — hide on scroll down, show on any scroll
     up, always visible at the top. Transform only; see
     useHideOnScroll for the hysteresis design. */
  const hidden = useHideOnScroll();

  /* A tooltip left open must not linger while the bar is away. */
  useEffect(() => {
    if (hidden) setTip(null);
  }, [hidden]);

  const showTip = (e, label) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.max(
      56,
      Math.min(window.innerWidth - 56, r.left + r.width / 2),
    );
    setTip({ label, x });
  };
  const hideTip = () => setTip(null);

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
      <nav
        className="pointer-events-auto nav-glass flex max-w-6xl items-center justify-center gap-0 overflow-x-auto rounded-[1.125rem] px-1 py-2 sm:gap-2 sm:px-3 sm:py-2.5"
        aria-label="Primary"
      >
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
              className={`${navItemBase} ${active ? `${navItemActive} ${navItemHover}` : `${navItemIdle} ${navItemHover}`}`}
            >
              <Icon {...iconProps} aria-hidden />
              <span className="sr-only">{label}</span>
            </a>
          );
        })}

        {/* Divider */}
        <div className="mx-1 h-6 w-px shrink-0 bg-glass/[0.1]" aria-hidden />

        {/* Theme toggle */}
        <div
          className="shrink-0"
          onMouseEnter={(e) =>
            showTip(e, isDark ? 'Light mode' : 'Dark mode')
          }
          onMouseLeave={hideTip}
          onFocus={(e) =>
            showTip(e, isDark ? 'Light mode' : 'Dark mode')
          }
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
    </header>
  );
}
