export function Tag({ children, className = '', accent = false }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium sm:text-[0.8125rem] ${
        accent
          ? 'border-accent/35 bg-accent/10 text-accent'
          : 'border-white/10 bg-white/[0.04] text-slate-300'
      } ${className}`}
    >
      {children}
    </span>
  );
}
