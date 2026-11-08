export function Tag({ children, className = '', accent = false }) {
  /* Pills are labels, not buttons, so the hover is deliberately
     quiet: a 1px lift and a slightly deeper tint. Enough to feel
     alive under the cursor, never enough to fake clickability. */
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium transition-all duration-200 hover:-translate-y-px sm:text-[0.8125rem] ${
        accent
          ? 'border-accent/35 bg-accent/10 text-accent hover:border-accent/50 hover:bg-accent/15'
          : 'border-glass/10 bg-glass/[0.04] text-subtle hover:border-glass/20 hover:bg-glass/[0.07] hover:text-heading'
      } ${className}`}
    >
      {children}
    </span>
  );
}
