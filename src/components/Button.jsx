/* Every call site is a link (href passed directly or via
   externalLinkProps), so Button is always an anchor — no `as`
   prop. The `ghost` variant was never used by any call site
   (all uses are primary/secondary) and is gone; the
   `hero-cta-fill--ghost` CSS class on the hero buttons is
   unrelated (a resting-fill treatment, not this variant). */
export function Button({
  variant = 'primary',
  className = '',
  children,
  ...rest
}) {
  const base =
    'group inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-medium transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:rounded-xl sm:px-6 sm:py-3';
  const styles = {
    primary:
      'btn-primary bg-accent/15 text-accent shadow-accent-glow border border-accent/40 hover:bg-accent/25 hover:border-accent/60 hover:scale-[1.02] active:scale-[0.98] motion-reduce:hover:scale-100 motion-reduce:active:scale-100',
    secondary:
      'border border-glass/10 bg-glass/[0.04] text-body hover:border-accent/25 hover:bg-glass/[0.07] hover:text-heading hover:scale-[1.02] active:scale-[0.98] motion-reduce:hover:scale-100 motion-reduce:active:scale-100',
  };

  return (
    <a className={`${base} ${styles[variant] ?? styles.primary} ${className}`} {...rest}>
      {children}
    </a>
  );
}
