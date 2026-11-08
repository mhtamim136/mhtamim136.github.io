import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';

/* ── Year filter dropdown ─────────────────────────────────────── */
/* A CUSTOM dropdown (not a native <select> — it cannot be styled
   glassy). Frosted-glass panel: translucent surface + backdrop
   blur, a 1px light border, a subtle top specular highlight, soft
   shadow — the "liquid glass" look Tamim asked for. Selected
   option in the site accent with a checkmark; the trigger's
   chevron rotates on open. Springy open/close motion; instant
   under reduced motion.
   Keyboard: listbox semantics — Enter / Space / ArrowDown opens
   and focuses the selected option, arrows move between options,
   Enter selects, Escape closes, Tab closes, outside-click closes,
   focus returns to the trigger. Options are real <button>s with
   real focus (no roving tabindex bookkeeping).
   Trigger active state (Tamim, 2026-11-09): "All years" stays
   plain glass; a specific year selected colours the trigger in
   the same active tone as the language chips and the sort pill
   (accent border + accent-tinted bg + accent text +
   shadow-accent-glow) — the "a year filter is active" signal. */
const panelMotion = {
  initial: { opacity: 0, y: -6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.98 },
  transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
};

export function YearDropdown({ years, value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const reduceMotion = useReducedMotion();

  /* Options: "All years" first, then the years present in the data,
     newest first, with their live counts. `years` is derived from
     the repos — a new year appears by itself, a year with no repos
     never appears. */
  const options = [
    { year: null, label: 'All years' },
    ...years.map(({ year, count }) => ({ year, label: `${year} · ${count}` })),
  ];
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.year === value),
  );
  /* Trigger label stays short — just the year (or "All years").
     The counts live only inside the open panel, where they help
     pick; on the closed pill they are noise and widen it. */
  const selectedLabel = value === null ? 'All years' : String(value);

  /* Close on outside click. Escape is handled on the trigger /
     option keydowns (focus is always on one of them while open). */
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open ]);

  const focusOption = (index) => {
    const el = optionRefs.current[index];
    if (el) el.focus();
  };

  const openAndFocus = (index) => {
    setOpen(true);
    /* Focus after the panel mounts (rAF runs after the re-render). */
    requestAnimationFrame(() => focusOption(index));
  };

  const closeAndFocusTrigger = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const select = (year) => {
    onChange(year);
    closeAndFocusTrigger();
  };

  const handleTriggerKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!open) openAndFocus(selectedIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) openAndFocus(options.length - 1);
    } else if (e.key === 'Escape' && open) {
      e.preventDefault();
      closeAndFocusTrigger();
    }
  };

  const handleOptionKeyDown = (e, index) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusOption((index + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusOption((index - 1 + options.length) % options.length);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeAndFocusTrigger();
    } else if (e.key === 'Tab') {
      /* Let Tab move on naturally, but close the panel first. */
      setOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      /* Explicit activation: options carry role="option", so the
         component owns selection (the ARIA listbox pattern) instead
         of relying on native button activation, which is not
         guaranteed once the button is re-roled as an option.
         preventDefault suppresses the native click, so select()
         runs exactly once. */
      e.preventDefault();
      select(options[index].year);
    }
  };

  const panel = (
    <div
      id="year-filter-listbox"
      role="listbox"
      aria-label="Filter projects by year"
      className="absolute right-0 z-50 mt-2 w-48 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-glass/10 bg-surface-elevated/90 shadow-glass backdrop-blur-xl"
    >
      {/* Top specular highlight — the liquid-glass light edge. */}
      <div
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
        aria-hidden
      />
      <ul className="py-1.5">
        {options.map((opt, i) => {
          const selected = opt.year === value;
          return (
            <li key={opt.year ?? 'all'} role="none">
              <button
                ref={(el) => {
                  optionRefs.current[i] = el;
                }}
                type="button"
                role="option"
                aria-selected={selected}
                tabIndex={-1}
                onClick={() => select(opt.year)}
                onKeyDown={(e) => handleOptionKeyDown(e, i)}
                className={`flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-sm transition-colors duration-150 focus-visible:bg-accent/10 focus-visible:outline-none ${
                  selected
                    ? 'font-semibold text-accent'
                    : 'text-muted hover:bg-accent/10 hover:text-heading'
                }`}
              >
                {opt.label}
                {selected && <Check className="h-4 w-4 shrink-0" aria-hidden />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="year-filter-listbox"
        onClick={() => (open ? setOpen(false) : openAndFocus(selectedIndex))}
        onKeyDown={handleTriggerKeyDown}
        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 sm:text-sm ${
          value !== null
            ? 'border-accent/40 bg-accent/15 text-accent shadow-accent-glow hover:bg-accent/20'
            : 'border-glass/15 bg-glass/[0.06] text-muted hover:border-accent/40 hover:bg-accent/10 hover:text-accent'
        }`}
      >
        Year: {selectedLabel}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {reduceMotion ? (
        open && panel
      ) : (
        <AnimatePresence>
          {open && <motion.div {...panelMotion}>{panel}</motion.div>}
        </AnimatePresence>
      )}
    </div>
  );
}
