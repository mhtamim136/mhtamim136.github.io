/**
 * POST /api/contact — contact form delivery via Resend.
 *
 * The browser posts JSON { name, email, message, website? }.
 * `website` is a honeypot field: bots that fill it get a fake 200
 * without any email being sent.
 *
 * On any Resend failure (including the free tier's 100/day limit —
 * Resend answers 429) this returns 502 {error:'email_failed'} so the
 * frontend can fall back to Web3Forms. The email never silently drops.
 *
 * Rate limit: 5 requests/minute per client IP, in memory. This is
 * best-effort (serverless instances are ephemeral and each has its
 * own map) — it stops casual spam, it is not a security boundary.
 *
 * Env: RESEND_API_KEY (required), CONTACT_TO_EMAIL (optional,
 * defaults to mhtamim136@gmail.com).
 */

import { Resend } from 'resend';
import { validateContact } from '../src/utils/contactValidation.js';

/* Validation limits live in src/utils/contactValidation.js (W9) —
   shared with the client hook so the two layers can never drift. */

/* Per-IP request timestamps (ms). Pruned on each request. */
const rateLimit = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 5;

function isRateLimited(ip) {
  const now = Date.now();
  const hits = (rateLimit.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX) {
    rateLimit.set(ip, hits);
    return true;
  }
  hits.push(now);
  rateLimit.set(ip, hits);
  /* Opportunistic cleanup so the map cannot grow unboundedly. */
  if (rateLimit.size > 1000) {
    for (const [key, times] of rateLimit) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) rateLimit.delete(key);
    }
  }
  return false;
}

/* Vercel sets x-real-ip to the connecting client — prefer it.
   x-forwarded-for's first entry is client-supplied and can be
   spoofed to dodge the per-IP limit, so it is only a fallback
   for runtimes without x-real-ip (local dev). */
function clientIp(req) {
  const realIp = req.headers?.['x-real-ip'];
  if (typeof realIp === 'string' && realIp.length > 0) {
    return realIp.trim();
  }
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

/* Vercel's Node runtime normally parses a JSON body into req.body,
   but read the stream as a fallback so this works either way. */
async function readJsonBody(req) {
  if (req.body !== undefined) {
    if (req.body === null) return null;
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return null;
      }
    }
    return req.body;
  }
  /* No parsed body — read the stream (real Vercel requests are
     async-iterable). If there is no stream either, treat as no body
     instead of crashing. */
  if (typeof req[Symbol.asyncIterator] !== 'function') return null;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'not_configured' });
  }

  if (isRateLimited(clientIp(req))) {
    return res.status(429).json({ error: 'rate_limited' });
  }

  const body = await readJsonBody(req);
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'invalid_input' });
  }

  /* Honeypot: a filled `website` field means a bot — pretend
     success and send nothing. Any defined non-null value counts
     (W7): the old `typeof === 'string'` check let a bot posting
     `website: true` or `website: 1` straight through. */
  if (body.website !== undefined && body.website !== null && String(body.website).trim() !== '') {
    return res.status(200).json({ ok: true });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  /* Same validator + limits as the client hook (W9) — see
     src/utils/contactValidation.js. */
  if (Object.keys(validateContact({ name, email, message })).length > 0) {
    return res.status(400).json({ error: 'invalid_input' });
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || 'Portfolio Contact <onboarding@resend.dev>',
      to: process.env.CONTACT_TO_EMAIL || 'mhtamim136@gmail.com',
      replyTo: email,
      subject: `Portfolio contact: ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    });

    if (error) {
      /* Includes Resend's 429 when the 100/day free limit is hit. */
      console.error('[api/contact] Resend error:', error.statusCode || 'unknown');
      return res.status(502).json({ error: 'email_failed' });
    }

    return res.status(200).json({ ok: true });
  } catch {
    console.error('[api/contact] Resend threw');
    return res.status(502).json({ error: 'email_failed' });
  }
}
