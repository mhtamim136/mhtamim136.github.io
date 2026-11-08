import { useState } from 'react';
import { Clock, Code, FolderOpen, Home, Layers, Mail, User } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

const NAV_ICONS = {
  home: Home,
  user: User,
  code: Code,
  /** Projects — folder represents grouped work clearly */
  folder: FolderOpen,
  timeline: Clock,
  layers: Layers,
  mail: Mail,
};

const iconProps = {
  className: 'h-5 w-5 shrink-0 transition-colors duration-300 ease-out',
  strokeWidth: 1.5,
};

const navItemBase =
  'flex shrink-0 items-center justify-center rounded-xl p-2 transition-all duration-300 ease-out sm:p-3';

/** Hover: subtle lift, soft translucent pill — glass-friendly */
const navItemHover =
  'hover:-translate-y-1 hover:scale-[1.07] hover:bg-glass/[0.06] hover:text-accent';

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
 * Mobile (~390px): tighter icon padding keeps all 7 icons + the toggle
 * inside the viewport (7×36 + gaps + toggle ≈ 365px), so the toggle
 * stays reachable without a sideways swipe. overflow-x-auto remains
 * only as a safety net for narrower screens.
 */
export function Navbar({ items, activeId, isDark, onThemeToggle }) {
  const [tip, setTip] = useState(null);

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
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-6 sm:pt-4">
      <nav
        className="pointer-events-auto nav-glass flex max-w-6xl items-center justify-center gap-1 overflow-x-auto rounded-[1.125rem] px-2 py-2 sm:gap-2 sm:px-3 sm:py-2.5"
        aria-label="Primary"
      >
        {items.map(({ id, label, icon }) => {
          const active = activeId === id;
          const Icon = NAV_ICONS[icon] ?? Home;
          return (
            <a
              key={id}
              href={`#${id}`}
              aria-current={active ? 'true' : undefined}
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
