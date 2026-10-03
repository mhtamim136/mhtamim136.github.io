import { useState, useCallback } from 'react';

const WEB3FORMS_URL = 'https://api.web3forms.com/submit';

/**
 * Manages contact form state: field values, validation,
 * submission via Web3Forms, and success/error feedback.
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
      if (!validate()) return;

      if (!accessKey) {
        setStatus('error');
        setServerMsg('Contact form is not configured. Please set VITE_WEB3FORMS_KEY.');
        return;
      }

      setStatus('sending');

      try {
        const formData = new FormData(e.target);
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
    },
    [validate, accessKey],
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
