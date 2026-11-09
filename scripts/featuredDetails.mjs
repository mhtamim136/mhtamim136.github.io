/**
 * Shared pure logic for pin-driven Featured Projects.
 *
 * Used by BOTH data sources so the rules can never drift apart:
 * - scripts/fetch-projects.mjs (build-time snapshot)
 * - api/projects.js (Vercel Function, live data)
 *
 * The fallback chain for a featured repo's case-study details is:
 *   1. `portfolio.json` in the repo root (structured, wins if valid)
 *   2. The repo's README.md (`## Overview` / `## Problem` /
 *      `## Solution` / `## Features` sections)
 *   3. The restored curated data in src/data/portfolio.js
 *   4. The GitHub description + languages (the card never renders empty)
 *
 * Nothing here makes network calls and nothing here invents text —
 * every string comes from one of those four sources.
 */

export const MAX_FEATURED = 4;

/* The portfolio site itself — never a Featured project (featuring
   your own portfolio on your own portfolio is redundant). Compared
   case-insensitively, like the rest of the exclusion logic. */
export const PORTFOLIO_SITE_REPO = 'mhtamim136.github.io';

/**
 * Pick the featured repo names: pinned repos, in pin order, first
 * MAX_FEATURED, excluding the portfolio site itself, and only repos
 * that are actually in the fetched repo list (a pinned fork, or a
 * repo that failed to load, must never produce a dangling card).
 */
export function pickFeatured(pinnedNames, repos) {
  const available = new Set((repos || []).map((r) => r.name.toLowerCase()));
  const featured = [];
  for (const name of pinnedNames || []) {
    if (typeof name !== 'string') continue;
    const lower = name.toLowerCase();
    if (lower === PORTFOLIO_SITE_REPO) continue;
    if (!available.has(lower)) continue;
    if (featured.some((f) => f.toLowerCase() === lower)) continue;
    featured.push(name);
    if (featured.length >= MAX_FEATURED) break;
  }
  return featured;
}

/**
 * Normalise a Markdown heading for matching: strip leading emoji /
 * punctuation / spaces, lowercase, trim. Turns "## 📘 Overview",
 * "## 🧰 Features" and "## ✨ Features" into "overview" / "features".
 */
export function normalizeHeading(raw) {
  return (raw || '')
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .trim()
    .toLowerCase();
}

/* A Markdown `## ` (level-2) heading line, or null. */
function headingOf(line) {
  const m = line.match(/^##\s+(.*)$/);
  return m ? normalizeHeading(m[1]) : null;
}

/* Strip light Markdown from extracted text: bold/italic markers,
   inline links [text](url) -> text, images ![alt](url) -> alt. */
function stripMarkdown(text) {
  return (text || '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/* First paragraph of a section (up to the first blank line),
   capped so a long README section can't blow up a card. */
function firstParagraph(section, maxLen = 600) {
  if (!section) return null;
  const para = section
    .split(/\n\s*\n/)
    .map((p) => stripMarkdown(p))
    .find((p) => p.length > 0);
  if (!para) return null;
  return para.length > maxLen ? `${para.slice(0, maxLen - 1).trim()}…` : para;
}

/* Bullet items of a section: lines starting with -, *, + or "1." etc. */
function sectionBullets(section, maxItems = 6) {
  if (!section) return [];
  const items = [];
  for (const line of section.split('\n')) {
    const m = line.match(/^\s*(?:[-*+]|\d+[.)])\s+(.+)$/);
    if (!m) continue;
    const text = stripMarkdown(m[1]);
    if (text) items.push(text);
    if (items.length >= maxItems) break;
  }
  return items;
}

/**
 * Split a README into its level-2 sections, keyed by normalised
 * heading. Returns {} for an empty / unparseable README.
 * Level-1 headings and deeper headings do not split sections.
 */
export function parseReadmeSections(markdown) {
  const sections = {};
  if (typeof markdown !== 'string' || markdown.trim() === '') return sections;
  let current = null;
  const lines = markdown.split('\n');
  for (const line of lines) {
    const heading = headingOf(line);
    if (heading !== null) {
      current = heading;
      if (!(current in sections)) sections[current] = [];
      continue;
    }
    if (current !== null) sections[current].push(line);
  }
  for (const key of Object.keys(sections)) {
    sections[key] = sections[key].join('\n').trim();
  }
  return sections;
}

/**
 * Details from a parsed README. Overview text doubles as the
 * intro/problem text (his READMEs have Overview, not Problem); an
 * About section is the next-best intro when neither exists.
 * Returns null when the README yields nothing usable.
 */
export function detailsFromReadme(sections) {
  const problem =
    firstParagraph(sections.problem) ||
    firstParagraph(sections.overview) ||
    firstParagraph(sections.about);
  const solution = firstParagraph(sections.solution);
  const features = sectionBullets(sections.features);
  if (!problem && !solution && features.length === 0) return null;
  return {
    problem: problem || null,
    solution: solution || null,
    features,
    contribution: null,
    tech: null,
    detailsSource: 'readme',
  };
}

/**
 * Details from a `portfolio.json` file in the repo root.
 * Shape: { problem?, solution?, features? (string[]),
 * contribution?, tech? (string[]) }. Anything malformed or empty
 * is treated as absent (the caller falls through to the next layer).
 */
export function detailsFromPortfolioJson(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const text = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  const list = (v) =>
    Array.isArray(v)
      ? v.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim())
      : [];
  const details = {
    problem: text(data.problem),
    solution: text(data.solution),
    features: list(data.features),
    contribution: text(data.contribution),
    tech: list(data.tech),
  };
  if (!details.problem && !details.solution && details.features.length === 0) {
    return null;
  }
  return { ...details, detailsSource: 'portfolio.json' };
}

/* Repo name from a curated entry's github URL
   (…/github.com/mhtamim136/<repo-name>). */
function repoNameFromGithubUrl(url) {
  if (typeof url !== 'string') return null;
  const m = url.match(/github\.com\/[^/]+\/([^/#?]+)/);
  return m ? m[1].replace(/\/$/, '') : null;
}

/**
 * Details from the restored curated data (src/data/portfolio.js).
 * Matched by repo name (from the entry's github URL). Curated
 * entries have problem/solution/description/tech — no features list.
 * A curated `description` stands in as the intro (problem) text
 * when the entry has no problem statement — otherwise a
 * description-only entry would resolve to tech pills alone.
 */
export function detailsFromCurated(repoName, curatedProjects) {
  const entry = (curatedProjects || []).find(
    (p) => repoNameFromGithubUrl(p.github)?.toLowerCase() === repoName.toLowerCase(),
  );
  if (!entry) return null;
  const text = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  const tech = Array.isArray(entry.tech)
    ? entry.tech.filter((x) => typeof x === 'string' && x.trim())
    : [];
  const problem = text(entry.problem) || text(entry.description);
  const solution = text(entry.solution);
  if (!problem && !solution && tech.length === 0) return null;
  return {
    problem: problem || null,
    solution: solution || null,
    features: [],
    contribution: null,
    tech,
    detailsSource: 'curated',
  };
}

/**
 * The fallback chain, in order. `inputs`:
 *   portfolioJson — parsed JSON of the repo's portfolio.json (or null)
 *   readmeText    — raw README.md text (or null)
 *   curated       — the restored curated projects array
 *   repo          — the repo object ({ name, description, languages })
 * Always returns a details object; the last layer (github) only
 * needs the description to exist, and even that may be null — the
 * card then shows languages/tech only, never invented text.
 */
export function resolveDetails({ portfolioJson, readmeText, curated, repo }) {
  const fromFile = detailsFromPortfolioJson(portfolioJson);
  if (fromFile) return fromFile;

  const fromReadme = detailsFromReadme(parseReadmeSections(readmeText));
  if (fromReadme) return fromReadme;

  const fromCurated = detailsFromCurated(repo.name, curated);
  if (fromCurated) return fromCurated;

  return {
    problem:
      repo.description && repo.description.trim() ? repo.description.trim() : null,
    solution: null,
    features: [],
    contribution: null,
    tech: null,
    detailsSource: 'github',
  };
}
