/**
 * Shared contact-form validation — ONE source of truth for the
 * client hook (src/hooks/useContactForm.js) and the serverless
 * function (api/contact.js). The two copies drifted before (W9):
 * the client had no maxima, so a 6,000-char message passed client
 * validation, got a 400 from /api/contact, and was then delivered
 * anyway via the Web3Forms fallback. Both sides now call
 * validateContact() with the same limits.
 *
 * Pure logic, no React, no Node/browser APIs — importable from
 * either side, the same way src/utils/githubShared.js is shared
 * between src/ and api/.
 *
 * NOTE: the minima (name ≥ 2, message ≥ 10) are the client's
 * UX minima and now apply server-side too — previously the server
 * accepted ≥ 1. A direct API caller sending a 1-char name or a
 * 5-char message now gets a 400, exactly like the form does.
 */
export const CONTACT_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const CONTACT_MIN_NAME = 2;
export const CONTACT_MIN_MESSAGE = 10;
export const CONTACT_MAX_NAME = 100;
export const CONTACT_MAX_MESSAGE = 5000;

/**
 * Validate { name, email, message } (trimmed inside). Returns an
 * object of field → error message, empty when valid. Non-string
 * values are treated as empty — callers that accept raw JSON
 * should coerce to strings first (api/contact.js does).
 */
export function validateContact({ name = '', email = '', message = '' } = {}) {
  const errs = {};
  const trimmed = {
    name: typeof name === 'string' ? name.trim() : '',
    email: typeof email === 'string' ? email.trim() : '',
    message: typeof message === 'string' ? message.trim() : '',
  };

  if (!trimmed.name) {
    errs.name = 'Name is required';
  } else if (trimmed.name.length < CONTACT_MIN_NAME) {
    errs.name = 'Name must be at least 2 characters';
  } else if (trimmed.name.length > CONTACT_MAX_NAME) {
    errs.name = 'Name must be at most 100 characters';
  }

  if (!trimmed.email) {
    errs.email = 'Email is required';
  } else if (!CONTACT_EMAIL_RE.test(trimmed.email)) {
    errs.email = 'Enter a valid email address';
  }

  if (!trimmed.message) {
    errs.message = 'Message is required';
  } else if (trimmed.message.length < CONTACT_MIN_MESSAGE) {
    errs.message = 'Message must be at least 10 characters';
  } else if (trimmed.message.length > CONTACT_MAX_MESSAGE) {
    errs.message = 'Message must be at most 5000 characters';
  }

  return errs;
}
