/* Single source of truth for the site's GitHub identity.
 *
 * These values were copy-pasted across hooks / API routes / build
 * scripts and drifted apart. New code imports from here.
 *
 * NOTE: api/projects.js, scripts/fetch-projects.mjs,
 * src/hooks/useGitHubRepos.js and src/hooks/useRepoLanguages.js
 * still carry their own copies (data-track files, out of this
 * change's scope) — they should import this module too, so the
 * username/host live in exactly one place.
 */
export const GITHUB_USERNAME = 'mhtamim136';
export const GITHUB_PAGES_HOST = 'mhtamim136.github.io';
