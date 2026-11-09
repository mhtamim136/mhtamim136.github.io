export function Tag({
  children,
  className = '',
  accent = false,
  count = null,
  button = false,
  active = false,
  onClick,
  ariaLabel,
}) {
  /* Pills are labels, not buttons, so the hover is deliberately
     quiet: a 1px lift and a slightly deeper tint. Enough to feel
     alive under the cursor, never enough to fake clickability.
     A pill with count >= 1 is a real <button> instead: it filters
     the Projects section, so it gets a focus-visible ring, an
     aria-pressed state, and the FilterChip's active tone. */
  const badge =
    typeof count === 'number' && count > 0 ? (
      <span className="ml-1 opacity-70" aria-hidden>
        · {count}
      </span>
    ) : null;
  const tone = active
    ? 'tone-accent border-accent/40 bg-accent/15 text-accent shadow-accent-glow hover:bg-accent/20'
    : accent
      ? 'tone-accent border-accent/35 bg-accent/10 text-accent hover:border-accent/50 hover:bg-accent/15'
      : 'border-glass/10 bg-glass/[0.04] text-subtle hover:border-glass/20 hover:bg-glass/[0.07] hover:text-heading';
  /* Tier 3 — tap targets: a clickable pill is a real <button>, so
     it gets a 44px hit area (px-3.5 py-3.5 → 46px tall) while the
     plain label <span> keeps its compact padding. The icon and
     text sizes never change — only the padding grows. */
  const pad = button ? 'px-3.5 py-3.5' : 'px-2.5 py-1';
  const classes = `inline-flex items-center rounded-md border ${pad} text-xs font-medium transition-all duration-200 hover:-translate-y-px sm:text-[0.8125rem] ${tone} ${className}`;
  if (button) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        aria-label={ariaLabel}
        className={`${classes} cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ring-offset-surface`}
      >
        {children}
        {badge}
      </button>
    );
  }
  return (
    <span className={classes}>
      {children}
      {badge}
    </span>
  );
}
