import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FaGithub, FaInstagram, FaFacebook, FaDiscord } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { FiGlobe } from 'react-icons/fi';
import { MdEmail } from 'react-icons/md';
import { Send, AlertCircle, ArrowLeft, Loader2, Copy, Check } from 'lucide-react';
import { portfolio } from '../data/portfolio';
import { SectionWrapper } from '../components/SectionWrapper';
import { Button } from '../components/Button';
import { Magnetic } from '../components/Magnetic';
import { NavIcon } from '../components/icons/NavIcons';
import { SocialButton } from '../components/SocialButton';
import { useContactForm } from '../hooks/useContactForm';
import '../sections/HeroCtaFill.css';

const socialMeta = [
  { key: 'github', label: 'GitHub', Icon: FaGithub },
  { key: 'profileCard', label: 'Profile Card', Icon: FiGlobe },
  { key: 'x', label: 'X (Twitter)', Icon: FaXTwitter },
  { key: 'instagram', label: 'Instagram', Icon: FaInstagram },
  { key: 'facebook', label: 'Facebook', Icon: FaFacebook },
  { key: 'discord', label: 'Discord', Icon: FaDiscord },
];

const listContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

/* Tier 3 — the socials cascade rise is capped at 8px (was 14px):
   the gap between items is 10px, so 8px is below it — two
   adjacent items can never overlap even if their stagger
   desyncs completely under a fast fling. Same 0.45s duration
   and 0.07s stagger, so the cascade still reads. */
const listItem = {
  hidden: { opacity: 0, y: 8, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ── Floating label field ───────────────────────────────────────
   One component for the input and the textarea (Tier 4, S2 — they
   were ~90% the same code: wrapper, floating-label classes, error
   rendering). `multiline` renders the textarea; everything else —
   label, error, classes — is shared, so a label/validation change
   is made once. The rendered class SET is identical to the old
   two components (only the attribute order differs, which does
   not affect the cascade). */
function FloatingField({
  id,
  name,
  type = 'text',
  label,
  value,
  onChange,
  error,
  autoComplete,
  multiline = false,
  rows,
}) {
  const filled = value.length > 0;
  const fieldClass = `contact-input peer w-full rounded-xl border bg-glass/[0.03] px-4 pt-6 text-sm text-heading outline-none transition-all duration-250 placeholder-shown:pt-4 focus:border-accent/50 focus:bg-glass/[0.05] focus:ring-1 focus:ring-accent/25 sm:text-base ${
    multiline ? 'resize-none pb-3' : 'pb-2.5'
  } ${
    error
      ? 'border-red-400/60 focus:border-red-400/80 focus:ring-red-400/20'
      : 'border-glass/[0.08] hover:border-glass/[0.14]'
  }`;
  const labelClass = `pointer-events-none absolute left-4 top-2 origin-[0] text-[0.6875rem] font-medium uppercase tracking-wider transition-all duration-200 ${
    filled
      ? ''
      : 'peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:font-normal'
  } peer-focus:top-2 peer-focus:text-[0.6875rem] peer-focus:uppercase peer-focus:tracking-wider peer-focus:font-medium ${
    error ? 'text-red-400' : 'text-muted-dim peer-focus:text-accent'
  }`;
  return (
    <div className="relative">
      {multiline ? (
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder=" "
          autoComplete="off"
          rows={rows ?? 5}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={fieldClass}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder=" "
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={fieldClass}
        />
      )}
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* ── Copy-email button ──────────────────────────────────────────
   Copies the address via the Clipboard API with a textarea +
   execCommand fallback for older browsers. Shows "Copied" for
   ~2s, then reverts. A real <button> with a focus-visible ring;
   the label sits in an aria-live region so screen readers
   announce the copy. */
function CopyEmailButton({ email }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const copy = useCallback(async () => {
    /* Assigned on every path below before it is read (clipboard
       success → true; execCommand result; inner failure → false),
       so no initializer — `let ok = false` was a useless
       assignment (eslint no-useless-assignment). */
    let ok;
    try {
      await navigator.clipboard.writeText(email);
      ok = true;
    } catch {
      /* Clipboard API unavailable (older browser / non-secure
         context) — fall back to the classic execCommand path. */
      try {
        const ta = document.createElement('textarea');
        ta.value = email;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (!ok) return;
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  }, [email]);

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Email address copied' : 'Copy email address'}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-3.5 text-xs font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        copied
          ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-400'
          : 'border-glass/10 bg-glass/[0.04] text-muted hover:border-accent/25 hover:text-accent'
      }`}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden />
      )}
      <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

/* ── Main section ─────────────────────────────────────────────── */
export function ContactSection() {
  const { contacts, resumeLink } = portfolio;
  const { fields, errors, status, serverMsg, handleChange, handleSubmit, reset } = useContactForm();
  /* Reduced motion: the submit button's hover/tap gestures are
     gated below — under reduced motion the button must not move. */
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <SectionWrapper
      id="contact"
      title="Contact"
      subtitle="Open to collaboration, project work, and new opportunities."
    >
      <div className="grid gap-8 lg:grid-cols-5">
        {/* ── Left: Contact form ── */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-3"
        >
          {/* Same hover language as Card (border steps up, soft
              shadow) but deliberately WITHOUT the tilt — a form
              should stay still under the hand while typing. */}
          <div className="rounded-2xl border border-card bg-card p-6 shadow-glass backdrop-blur-xl transition-[border-color,box-shadow] duration-300 hover:border-[var(--card-border-hover)] hover:shadow-glass-hover sm:p-8">
            {/* Success state */}
            {status === 'success' && (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                role="status"
                className="flex min-h-[280px] flex-col items-center justify-center text-center"
              >
                {/* Drawn check (anim #7): the circle stroke draws
                    itself (0.5s), then the check stroke (0.35s) —
                    the send is the one transaction on the site, so
                    its success gets a drawn check instead of a
                    static icon. Same h-8 w-8 emerald mark inside
                    the existing emerald ring; the panel scale-in
                    is unchanged. Under reduced motion both strokes
                    render at pathLength 1 instantly. */}
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10">
                  <svg
                    className="h-8 w-8 text-emerald-400"
                    viewBox="0 0 32 32"
                    fill="none"
                    aria-hidden
                  >
                    <motion.circle
                      cx="16"
                      cy="16"
                      r="14"
                      stroke="currentColor"
                      strokeWidth="2"
                      initial={reduceMotion ? false : { pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    />
                    <motion.path
                      d="M10 16.5l4 4 8-9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={reduceMotion ? false : { pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{
                        duration: 0.35,
                        delay: 0.5,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-heading">Message sent!</h3>
                <p className="mt-2 max-w-sm text-sm text-muted">
                  Thanks for reaching out — I&apos;ll get back to you.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl border border-glass/10 bg-glass/[0.04] px-5 py-3 text-sm font-medium text-muted transition-all duration-300 hover:border-accent/25 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  Send another message
                </button>
              </motion.div>
            )}

            {/* Form */}
            {status !== 'success' && (
              <form onSubmit={handleSubmit} noValidate>
                {/* Honeypot — hidden from real users, catches bots */}
                <input
                  type="checkbox"
                  name="botcheck"
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div className="space-y-5">
                  <FloatingField
                    id="contact-name"
                    name="name"
                    label="Your name"
                    autoComplete="name"
                    value={fields.name}
                    onChange={handleChange}
                    error={errors.name}
                  />
                  <FloatingField
                    id="contact-email"
                    name="email"
                    type="email"
                    label="Email address"
                    autoComplete="email"
                    value={fields.email}
                    onChange={handleChange}
                    error={errors.email}
                  />
                  <FloatingField
                    id="contact-message"
                    name="message"
                    label="Your message"
                    multiline
                    rows={5}
                    value={fields.message}
                    onChange={handleChange}
                    error={errors.message}
                  />
                </div>

                {/* Error banner */}
                {status === 'error' && (
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300"
                    role="alert"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    {serverMsg}
                  </motion.div>
                )}

                {/* Submit button — magnetic. The wrapper keeps the
                    button's own layout classes: full-width on mobile,
                    auto width from sm up (see Magnetic.jsx). */}
                <Magnetic className="w-full sm:inline-block sm:w-auto">
                  {/* Same 550ms L-to-R wipe as the hero primary (Tier 4,
                      item 21). Idle + enabled only: the shared hover
                      rule is gated with :not(:disabled), and the
                      button also has disabled:pointer-events-none, so
                      the "Sending…" state can never show a fill. */}
                  <motion.button
                    type="submit"
                    disabled={status === 'sending'}
                    aria-busy={status === 'sending'}
                    whileHover={reduceMotion ? undefined : { scale: 1.02, y: -2 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    className="contact-send hero-cta-fill hero-cta-fill--solid mt-6 inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-accent/40 bg-accent/15 px-6 py-3 text-sm font-semibold text-accent shadow-accent-glow transition-all duration-300 hover:bg-accent/25 hover:border-accent/60 disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
                  >
                    {status === 'sending' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" aria-hidden />
                        Send message
                      </>
                    )}
                  </motion.button>
                </Magnetic>
              </form>
            )}
          </div>
        </motion.div>

        {/* ── Right: Email + Socials ── */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col gap-6 lg:col-span-2"
        >
          {/* Email card */}
          <div className="rounded-2xl border border-card bg-card p-6 shadow-glass backdrop-blur-xl transition-[border-color,box-shadow] duration-300 hover:border-[var(--card-border-hover)] hover:shadow-glass-hover">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-dim">Email</p>
            <div className="mt-3 flex items-center gap-2">
              <a
                href={`mailto:${contacts.email}`}
                className="group inline-flex min-w-0 items-center gap-2 text-sm font-medium text-body transition-all duration-300 hover:text-accent sm:text-base"
              >
                <MdEmail
                  className="h-5 w-5 shrink-0 text-muted transition-colors duration-300 group-hover:text-accent"
                  aria-hidden
                />
                <span className="truncate">{contacts.email}</span>
              </a>
              <CopyEmailButton email={contacts.email} />
            </div>
            {/* Download CV (anim #8, batch 2 fix): the same PDF
                the hero "Resume" button links to, but a real
                download — `download` saves the file under the
                given name instead of opening the PDF viewer in a
                new tab (the old externalLinkProps version opened
                it, which contradicted the "Download" label). Same
                secondary + ghost 550ms wipe as the hero Resume
                button. It lives in the email card so a recruiter
                who has read the page can take the CV without
                scrolling back to the hero. Full-width on mobile
                like the section's other buttons; the email row
                above is untouched. */}
            <div className="mt-4">
              <Button
                href={resumeLink}
                download="Murad-Hasan-Tamim-CV.pdf"
                variant="secondary"
                className="hero-cta-fill hero-cta-fill--ghost w-full sm:w-auto"
              >
                <NavIcon name="document" className="h-4 w-4" />
                Download CV
              </Button>
            </div>
          </div>

          {/* Socials card */}
          <div className="rounded-2xl border border-card bg-card p-6 shadow-glass backdrop-blur-xl transition-[border-color,box-shadow] duration-300 hover:border-[var(--card-border-hover)] hover:shadow-glass-hover">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-dim">Social</p>
            <motion.ul
              className="mt-4 flex flex-col gap-2.5"
              variants={listContainer}
              initial={reduceMotion ? false : 'hidden'}
              whileInView="show"
              viewport={{ once: true, margin: '-40px' }}
            >
              {socialMeta.map(({ key, label, Icon }) => {
                const href = contacts[key];
                if (!href) return null;
                return (
                  <motion.li key={key} variants={listItem}>
                    <SocialButton href={href} icon={Icon} className="w-full justify-start">
                      {label}
                    </SocialButton>
                  </motion.li>
                );
              })}
            </motion.ul>
          </div>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
