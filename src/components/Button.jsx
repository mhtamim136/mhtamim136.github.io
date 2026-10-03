export function Button({
  as: Component = 'a',
  variant = 'primary',
  className = '',
  children,
  ...rest
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:rounded-xl sm:px-6 sm:py-3';
  const styles = {
    primary:
      'bg-accent/15 text-accent shadow-accent-glow border border-accent/40 hover:bg-accent/25 hover:border-accent/60 hover:scale-[1.02] active:scale-[0.98]',
    secondary:
      'border border-glass/10 bg-glass/[0.04] text-body hover:border-accent/25 hover:bg-glass/[0.07] hover:text-heading hover:scale-[1.02] active:scale-[0.98]',
    ghost: 'text-muted hover:text-accent border border-transparent hover:border-accent/20 hover:bg-glass/[0.03]',
  };

  return (
    <Component className={`${base} ${styles[variant] ?? styles.primary} ${className}`} {...rest}>
      {children}
    </Component>
  );
}
