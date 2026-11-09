/**
 * Skill → project matching for Interactive Skills.
 *
 * Pure logic, no network, no React — unit-tested in
 * /tmp/test-skill-counts.mjs (kept outside the repo).
 *
 * RULES (binding, Tamim's automation requirement):
 * - The SKILLS LIST stays curated in src/data/portfolio.js. A repo
 *   language is never a skill: e.g. "Jupyter Notebook" is the primary
 *   language of the oct-c8 repo and must never become a pill. This
 *   module only ever counts repos for skills that already exist.
 * - Counts are computed LIVE from the repo data at render — never
 *   hardcoded, never a config number. A future project auto-raises
 *   its language's count on the next data sync, with zero code or
 *   data changes.
 * - A repo matches a skill when the skill's normalized key appears
 *   in the repo's `languages[]` OR `topics[]` (both already in the
 *   projects data). The repo's primary `language` is used only when
 *   `languages[]` is absent (not an array) — a defensive fallback,
 *   not a separate source.
 *
 * NORMALIZATION — the alias map is EXPLICIT, never "strip
 * non-alphanumerics": stripping would collapse 'C++' and 'C' into
 * the same key ('c'). The map covers every skill whose display name
 * differs from its canonical key; everything else lowercases.
 * Repo values go through the same function, so 'C++' (a GitHub
 * language) and 'cpp' (a GitHub topic) both canonicalize to 'cpp',
 * while 'C' canonicalizes to 'c' and stays distinct.
 */
export const SKILL_KEY_ALIASES = {
  'C++': 'cpp',
  'C#': 'csharp',
  'Node.js': 'nodejs',
  'Express.js': 'express',
  'Tailwind CSS': 'tailwindcss',
  'HTML5': 'html',
  'CSS3': 'css',
  'MySQL': 'mysql',
  'SQL Server': 'sqlserver',
  'Oracle DB': 'oracle',
};

/** Canonical key for a skill display name, a repo language, or a repo topic. */
export function normalizeKey(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (Object.prototype.hasOwnProperty.call(SKILL_KEY_ALIASES, trimmed)) {
    return SKILL_KEY_ALIASES[trimmed];
  }
  return trimmed.toLowerCase();
}

/**
 * The set of canonical keys a repo matches under: its languages
 * (or the `extraLanguages` for that repo from ProjectsSection's
 * langMap, when the caller passes them) plus its topics.
 */
export function getRepoKeys(repo, extraLanguages) {
  const keys = new Set();
  const langs = Array.isArray(extraLanguages)
    ? extraLanguages
    : Array.isArray(repo.languages)
      ? repo.languages
      : repo.language
        ? [repo.language]
        : [];
  for (const lang of langs) {
    const key = normalizeKey(lang);
    if (key) keys.add(key);
  }
  const topics = Array.isArray(repo.topics) ? repo.topics : [];
  for (const topic of topics) {
    const key = normalizeKey(topic);
    if (key) keys.add(key);
  }
  return keys;
}

/** Number of repos in `repos` that use `skill`. `langMap` is the optional repo-name → languages map (ProjectsSection's merged map). */
export function countReposForSkill(skill, repos, langMap) {
  const key = normalizeKey(skill);
  if (!key) return 0;
  let count = 0;
  for (const repo of repos || []) {
    const extra = langMap ? langMap[repo.name] : undefined;
    if (getRepoKeys(repo, extra).has(key)) count += 1;
  }
  return count;
}

/**
 * Map of every curated skill → its live repo count. Keys are exactly
 * the skills in `skills` (the portfolio.js object) — a repo language
 * with no matching skill never appears here.
 */
export function skillCounts(skills, repos, langMap) {
  const counts = new Map();
  for (const items of Object.values(skills || {})) {
    for (const skill of items || []) {
      counts.set(skill, countReposForSkill(skill, repos, langMap));
    }
  }
  return counts;
}

/** Reverse lookup: canonical key → skill display name, or null. Used to label the active filter chip when the active filter is a framework/tool skill with no language chip. */
export function findSkillByKey(key, skills) {
  if (!key) return null;
  for (const items of Object.values(skills || {})) {
    for (const skill of items || []) {
      if (normalizeKey(skill) === key) return skill;
    }
  }
  return null;
}
