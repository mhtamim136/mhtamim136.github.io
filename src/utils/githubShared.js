/**
 * Shared GitHub constants + language processing — ONE source of truth.
 *
 * Used by:
 * - src/hooks/useGitHubRepos.js (browser: username + Pages host)
 * - api/projects.js (Vercel function: username + language processing)
 * - scripts/fetch-projects.mjs (build script: username + language processing)
 *
 * Previously each of those files carried its own copy of
 * GITHUB_USERNAME / processLanguages (and useGitHubRepos.js +
 * useContactForm.js each had GITHUB_PAGES_HOST). The copies drifted:
 * the hook's processLanguages had no fallback-language parameter,
 * and the script's copy was the one a token-less build used to
 * clobber the snapshot. One module, one behaviour.
 *
 * Pure JS, no imports — safe to import from browser, serverless,
 * and Node script contexts alike.
 */

/** The GitHub user whose public repos power the Projects section. */
export const GITHUB_USERNAME = 'mhtamim136';

/** Hostname where no serverless function exists — the site must use
 *  the build-time snapshot only and never attempt /api/projects. */
export const GITHUB_PAGES_HOST = 'mhtamim136.github.io';

/** Hide languages below 2% of a repo's total bytes. */
export const MIN_LANGUAGE_PERCENT = 2;

/**
 * Processes the raw { Language: bytes } object from the GitHub API.
 * - Filters out languages below MIN_LANGUAGE_PERCENT of total bytes
 * - Sorts by bytes descending (largest first)
 * - Returns an array of language name strings
 * - Falls back to the repo's primary language when the breakdown is
 *   empty or yields nothing (e.g. a failed fetch, or a repo whose
 *   languages are all below the threshold)
 */
export function processLanguages(raw, fallbackLanguage) {
  const entries = Object.entries(raw || {});
  if (entries.length === 0) {
    return fallbackLanguage ? [fallbackLanguage] : [];
  }
  const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);
  const langs = entries
    .filter(([, bytes]) => (bytes / total) * 100 >= MIN_LANGUAGE_PERCENT)
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang);
  return langs.length > 0 ? langs : fallbackLanguage ? [fallbackLanguage] : [];
}
