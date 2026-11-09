import { useState, useCallback } from 'react';
import { GITHUB_PAGES_HOST } from '../utils/githubShared';

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
 *   serverless function `/api/contact` (Resend) first. On ANY
 *   failure — function error, Resend error (including its 100/day
 *   free limit), network error — fall back to Web3Forms, so a
 *   message is never silently lost.
 * Web3Forms (VITE_WEB3FORMS_KEY) stays as the fallback everywhere.
 */
export function useContactForm() {
  const [fields, setFields] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [serverMsg, setServerMsg] = useState('');

  const accessKey = import.meta.env.VITE_WEB3FORMS_KEY;

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

  /* ── Validation ── */
  const validate = useCallback(() => {
    const errs = {};
    const trimmed = {
      name: fields.name.trim(),
      email: fields.email.trim(),
      message: fields.message.trim(),
    };

    if (!trimmed.name) {
      errs.name = 'Name is required';
    } else if (trimmed.name.length < 2) {
      errs.name = 'Name must be at least 2 characters';
    }

    if (!trimmed.email) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed.email)) {
      errs.email = 'Enter a valid email address';
    }

    if (!trimmed.message) {
      errs.message = 'Message is required';
    } else if (trimmed.message.length < 10) {
      errs.message = 'Message must be at least 10 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [fields]);

  /* ── Submit ── */
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      /* Already sending (e.g. a second Enter while the first
         request is in flight) — the submit button is disabled,
         but implicit form submission can still fire. */
      if (status === 'sending') return;
      if (!validate()) return;

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
          return;
        }
        /* Any non-OK answer — fall through to Web3Forms. */
      } catch {
        /* Network error — fall through to Web3Forms. */
      }

      await submitViaWeb3Forms();
    },
    [validate, accessKey, fields, status],
  );

  /* ── Reset to allow sending another message ── */
  const reset = useCallback(() => {
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
