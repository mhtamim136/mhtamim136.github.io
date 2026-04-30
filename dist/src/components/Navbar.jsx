import { NavIcon } from './icons/NavIcons';

export function Navbar({ items, activeId }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-surface/80 backdrop-blur-xl">
      <nav
        className="mx-auto flex max-w-6xl items-center justify-center gap-1 overflow-x-auto px-3 py-3 sm:gap-2 sm:px-6"
        aria-label="Primary"
      >
        {items.map(({ id, label, icon }) => {
          const active = activeId === id;
          return (
            <a
              key={id}
              href={`#${id}`}
              title={label}
              aria-current={active ? 'true' : undefined}
              className={`flex shrink-0 items-center justify-center rounded-xl p-2.5 transition-all duration-250 sm:p-3 ${
                active
                  ? 'bg-accent/15 text-accent shadow-accent-glow ring-1 ring-accent/30'
                  : 'text-muted hover:bg-white/[0.06] hover:text-slate-200'
              }`}
            >
              <NavIcon name={icon} />
              <span className="sr-only">{label}</span>
            </a>
          );
        })}
      </nav>
    </header>
  );
}
