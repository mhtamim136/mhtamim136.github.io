import { motion } from 'framer-motion';
import { FaGithub, FaInstagram, FaFacebook, FaDiscord } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { FiGlobe } from 'react-icons/fi';
import { MdEmail } from 'react-icons/md';
import { Send, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { portfolio } from '../data/portfolio';
import { SectionWrapper } from '../components/SectionWrapper';
import { SocialButton } from '../components/SocialButton';
import { useContactForm } from '../hooks/useContactForm';

const socialMeta = [
  { key: 'github', label: 'GitHub', Icon: FaGithub },
  { key: 'portfolio', label: 'Profile Card', Icon: FiGlobe },
  { key: 'x', label: 'X (Twitter)', Icon: FaXTwitter },
  { key: 'instagram', label: 'Instagram', Icon: FaInstagram },
  { key: 'facebook', label: 'Facebook', Icon: FaFacebook },
  { key: 'discord', label: 'Discord', Icon: FaDiscord },
];

const listContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const listItem = {
  hidden: { opacity: 0, y: 14, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ── Floating label input ─────────────────────────────────────── */
function FloatingInput({ id, name, type = 'text', label, value, onChange, error }) {
  const filled = value.length > 0;
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder=" "
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`peer w-full rounded-xl border bg-glass/[0.03] px-4 pb-2.5 pt-6 text-sm text-heading outline-none transition-all duration-250 placeholder-shown:pt-4 focus:border-accent/50 focus:bg-glass/[0.05] focus:ring-1 focus:ring-accent/25 sm:text-base ${
          error
            ? 'border-red-400/60 focus:border-red-400/80 focus:ring-red-400/20'
            : 'border-glass/[0.08] hover:border-glass/[0.14]'
        }`}
      />
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-4 top-2 origin-[0] text-[0.6875rem] font-medium uppercase tracking-wider transition-all duration-200 ${
          filled || 'peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:font-normal'
        } peer-focus:top-2 peer-focus:text-[0.6875rem] peer-focus:uppercase peer-focus:tracking-wider peer-focus:font-medium ${
          error ? 'text-red-400' : 'text-muted-dim peer-focus:text-accent'
        }`}
      >
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

/* ── Floating label textarea ──────────────────────────────────── */
function FloatingTextarea({ id, name, label, value, onChange, error }) {
  const filled = value.length > 0;
  return (
    <div className="relative">
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder=" "
        rows={5}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`peer w-full resize-none rounded-xl border bg-glass/[0.03] px-4 pb-3 pt-6 text-sm text-heading outline-none transition-all duration-250 placeholder-shown:pt-4 focus:border-accent/50 focus:bg-glass/[0.05] focus:ring-1 focus:ring-accent/25 sm:text-base ${
          error
            ? 'border-red-400/60 focus:border-red-400/80 focus:ring-red-400/20'
            : 'border-glass/[0.08] hover:border-glass/[0.14]'
        }`}
      />
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-4 top-2 origin-[0] text-[0.6875rem] font-medium uppercase tracking-wider transition-all duration-200 ${
          filled || 'peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:font-normal'
        } peer-focus:top-2 peer-focus:text-[0.6875rem] peer-focus:uppercase peer-focus:tracking-wider peer-focus:font-medium ${
          error ? 'text-red-400' : 'text-muted-dim peer-focus:text-accent'
        }`}
      >
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

/* ── Main section ─────────────────────────────────────────────── */
export function ContactSection() {
  const { contacts } = portfolio;
  const { fields, errors, status, serverMsg, handleChange, handleSubmit, reset } =
    useContactForm();

  return (
    <SectionWrapper
      id="contact"
      title="Contact"
      subtitle="Open to collaboration, project work, and new opportunities."
    >
      <div className="grid gap-8 lg:grid-cols-5">
        {/* ── Left: Contact form ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-3"
        >
          <div className="rounded-2xl border border-card bg-card p-6 shadow-glass backdrop-blur-xl sm:p-8">
            {/* Success state */}
            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex min-h-[280px] flex-col items-center justify-center text-center"
              >
                <CheckCircle className="h-12 w-12 text-emerald-400" />
                <h3 className="mt-4 text-lg font-semibold text-heading">Message sent!</h3>
                <p className="mt-2 text-sm text-muted">{serverMsg}</p>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl border border-glass/10 bg-glass/[0.04] px-5 py-2.5 text-sm font-medium text-muted transition-all duration-300 hover:border-accent/25 hover:text-accent"
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
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div className="space-y-5">
                  <FloatingInput
                    id="contact-name"
                    name="name"
                    label="Your name"
                    value={fields.name}
                    onChange={handleChange}
                    error={errors.name}
                  />
                  <FloatingInput
                    id="contact-email"
                    name="email"
                    type="email"
                    label="Email address"
                    value={fields.email}
                    onChange={handleChange}
                    error={errors.email}
                  />
                  <FloatingTextarea
                    id="contact-message"
                    name="message"
                    label="Your message"
                    value={fields.message}
                    onChange={handleChange}
                    error={errors.message}
                  />
                </div>

                {/* Error banner */}
                {status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300"
                    role="alert"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    {serverMsg}
                  </motion.div>
                )}

                {/* Submit button */}
                <motion.button
                  type="submit"
                  disabled={status === 'sending'}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-accent/40 bg-accent/15 px-6 py-3 text-sm font-semibold text-accent shadow-accent-glow transition-all duration-300 hover:bg-accent/25 hover:border-accent/60 disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
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
              </form>
            )}
          </div>
        </motion.div>

        {/* ── Right: Email + Socials ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col gap-6 lg:col-span-2"
        >
          {/* Email card */}
          <div className="rounded-2xl border border-card bg-card p-6 shadow-glass backdrop-blur-xl">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-dim">
              Email
            </p>
            <a
              href={`mailto:${contacts.email}`}
              className="group mt-3 inline-flex items-center gap-2 text-sm font-medium text-body transition-all duration-300 hover:text-accent sm:text-base"
            >
              <MdEmail
                className="h-5 w-5 shrink-0 text-muted transition-colors duration-300 group-hover:text-accent"
                aria-hidden
              />
              {contacts.email}
            </a>
          </div>

          {/* Socials card */}
          <div className="rounded-2xl border border-card bg-card p-6 shadow-glass backdrop-blur-xl">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-dim">
              Social
            </p>
            <motion.ul
              className="mt-4 flex flex-col gap-2.5"
              variants={listContainer}
              initial="hidden"
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
