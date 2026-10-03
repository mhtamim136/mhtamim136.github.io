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
  'flex shrink-0 items-center justify-center rounded-xl p-2.5 transition-all duration-300 ease-out sm:p-3';

/** Hover: subtle lift, scale, accent tint, soft glow */
const navItemHover =
  'hover:-translate-y-1 hover:scale-[1.07] hover:bg-glass/[0.06] hover:text-accent hover:shadow-[0_6px_22px_-4px_rgb(var(--accent)_/_0.22)]';

/** Active section: clear but restrained */
const navItemActive =
  'bg-glass/[0.055] text-accent ring-1 ring-accent/25 shadow-[inset_0_1px_0_0_rgb(var(--glass)_/_0.06)]';

const navItemIdle = 'text-muted-dim';

export function Navbar({ items, activeId, isDark, onThemeToggle }) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-6 sm:pt-4">
      <nav
        className="pointer-events-auto flex max-w-6xl items-center justify-center gap-1 overflow-x-auto rounded-2xl border border-glass/[0.08] bg-surface/75 px-2 py-2 shadow-float backdrop-blur-md sm:gap-2 sm:px-3 sm:py-2.5"
        aria-label="Primary"
      >
        {items.map(({ id, label, icon }) => {
          const active = activeId === id;
          const Icon = NAV_ICONS[icon] ?? Home;
          return (
            <a
              key={id}
              href={`#${id}`}
              title={label}
              aria-current={active ? 'true' : undefined}
              className={`${navItemBase} ${active ? `${navItemActive} ${navItemHover}` : `${navItemIdle} ${navItemHover}`}`}
            >
              <Icon {...iconProps} aria-hidden />
              <span className="sr-only">{label}</span>
            </a>
          );
        })}

        {/* Divider */}
        <div className="mx-1 h-6 w-px shrink-0 bg-glass/[0.08]" aria-hidden />

        {/* Theme toggle */}
        <ThemeToggle isDark={isDark} onToggle={onThemeToggle} />
      </nav>
    </header>
  );
}
