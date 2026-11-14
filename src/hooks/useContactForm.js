import { useState, useCallback, useRef } from 'react';
import { GITHUB_PAGES_HOST } from '../utils/githubShared';
import { validateContact } from '../utils/contactValidation';

const WEB3FORMS_URL = 'https://api.web3forms.com/submit';

/**
 * Manages contact form state: field values, validation,
 * submission, and success/error feedback.
 *
 * Submission chain:
 * - On GitHub Pages (mhtamim136.github.io): Web3Forms directly
 *   (existing behaviour — /api/contact is never attempted there,
 *   because no function exists on a static host).
 * - Everywhere else (Vercel, localhost): POST JSON to the
 *   serverless function `/api/contact` (Resend) first. On a
 *   function error, Resend error (including its 100/day free
 *   limit), or network error — fall back to Web3Forms, so a
 *   message is never silently lost. EXCEPTION (C2): a 429
 *   rate-limit answer is NEVER fallen back — the fallback has no
 *   rate limit, so falling back would bypass the limit entirely.
 * Web3Forms (VITE_WEB3FORMS_KEY) stays as the fallback everywhere.
 */
export function useContactForm() {
  const [fields, setFields] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [serverMsg, setServerMsg] = useState('');

  const accessKey = import.meta.env.VITE_WEB3FORMS_KEY;

  /* W8: in-flight flag, checked-and-set SYNCHRONOUSLY. The
     `status === 'sending'` check below reads the state captured
     when this callback was created, so two submits in the same
     frame (double-Enter / double-click before the re-render)
     both see 'idle' and both POST. A ref updates immediately,
     so the second submit sees the flag. Cleared on every terminal
     path below, and in `reset`. */
  const inFlightRef = useRef(false);

  /* ── Field change handler ── */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    /* Clear field error on edit */
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  /* ── Validation ──
     Shared with api/contact.js via src/utils/contactValidation.js
     (W9) — one validator, one set of limits, so the two layers
     can never drift again. */
  const validate = useCallback(() => {
    const errs = validateContact(fields);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [fields]);

  /* ── Submit ── */
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      /* Already sending (e.g. a second Enter while the first
         request is in flight) — the submit button is disabled,
         but implicit form submission can still fire. The ref
         check is the synchronous one (W8); the state check is
         belt-and-braces for a stale closure. */
      if (status === 'sending') return;
      if (inFlightRef.current) return;
      if (!validate()) return;
      inFlightRef.current = true;

      /* Capture the form data synchronously — the fallback below
         runs after an await, when the form may have changed. */
      const formEl = e.target;
      const formData = new FormData(formEl);

      const isGitHubPages = window.location.hostname === GITHUB_PAGES_HOST;

      /* On GitHub Pages the Web3Forms key is required (same as
         before); elsewhere the function is tried first, so a
         missing key only matters if the fallback is reached. */
      if (isGitHubPages && !accessKey) {
        setStatus('error');
        setServerMsg('Contact form is not configured. Please set VITE_WEB3FORMS_KEY.');
        inFlightRef.current = false;
        return;
      }

      setStatus('sending');

      /* ── Web3Forms path — unchanged from before. Used directly
         on GitHub Pages, and as the fallback everywhere else. ── */
      const submitViaWeb3Forms = async () => {
        if (!accessKey) {
          setStatus('error');
          setServerMsg('Contact form is not configured. Please set VITE_WEB3FORMS_KEY.');
          return;
        }

        try {
          formData.append('access_key', accessKey);

          const res = await fetch(WEB3FORMS_URL, {
            method: 'POST',
            body: formData,
          });

          const data = await res.json();

          if (data.success) {
            setStatus('success');
            setServerMsg(data.message || 'Message sent successfully!');
            setFields({ name: '', email: '', message: '' });
          } else {
            setStatus('error');
            setServerMsg(data.message || 'Something went wrong. Please try again.');
          }
        } catch {
          setStatus('error');
          setServerMsg('Network error. Please check your connection and try again.');
        }
      };

      /* GitHub Pages: Web3Forms directly, no function attempt. */
      if (isGitHubPages) {
        await submitViaWeb3Forms();
        inFlightRef.current = false;
        return;
      }

      /* ── Elsewhere: try the Vercel function first. ── */
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fields.name.trim(),
            email: fields.email.trim(),
            message: fields.message.trim(),
            /* Honeypot: forward the hidden `botcheck` checkbox as the
               API's `website` field — 'on' when a bot checked the
               box (the API then silently drops it), '' otherwise. */
            website: formData.get('botcheck') ? 'on' : '',
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok && data.ok) {
          setStatus('success');
          setServerMsg('Message sent successfully!');
          setFields({ name: '', email: '', message: '' });
          inFlightRef.current = false;
          return;
        }
        /* C2: 429 = rate-limited — do NOT fall back to Web3Forms.
           The fallback has no rate limit, so falling back would
           deliver the message anyway and the limit would throttle
           nothing. Any other non-OK answer (502/503 from a Resend
           failure, 400, 500) falls through to Web3Forms below. */
        if (res.status === 429) {
          setStatus('error');
          setServerMsg('Too many attempts. Please try again shortly.');
          inFlightRef.current = false;
          return;
        }
        /* Any other non-OK answer — fall through to Web3Forms. */
      } catch {
        /* Network error — fall through to Web3Forms. */
      }

      await submitViaWeb3Forms();
      inFlightRef.current = false;
    },
    [validate, accessKey, fields, status]
  );

  /* ── Reset to allow sending another message ── */
  const reset = useCallback(() => {
    inFlightRef.current = false;
    setStatus('idle');
    setServerMsg('');
    setErrors({});
  }, []);

  return {
    fields,
    errors,
    status,
    serverMsg,
    handleChange,
    handleSubmit,
    reset,
  };
}
