/**
 * Shared GitHub helpers for the two data sources — api/projects.js
 * (Vercel Function, live data) and scripts/fetch-projects.mjs
 * (build-time snapshot). One module so the rules can never drift
 * apart (precedent: api/projects.js already imports
 * scripts/featuredDetails.mjs).
 *
 * Only the PURE helpers live here (no network of their own):
 * baseName, encodePath, the exclusion set, the image-folder
 * constants, imagesFromTree, findRootFile, and fetchTreeForRepo —
 * which takes the caller's fetchJson, because the two fetchJson
 * implementations differ (the API route aborts on a timeout and
 * errors with just the status; the script tolerates a missing
 * token and includes the URL in the error). fetchPinnedRepoNames,
 * fetchJson, fetchText and enrichFeaturedRepo stay in their files:
 * their failure semantics differ (the API degrades to [] / 502,
 * the script keeps the previous snapshot and warns).
 */
import { GITHUB_USERNAME } from '../src/utils/githubShared.js';

export const EXCLUDED_REPOS = new Set([
  'mhtamim136', // GitHub profile README repo
  'mhtamim136.github.io', // This portfolio site itself
]);

/* Image folders for project-card slideshows. `Project_Card` is the
   convention; `Project Card` (with a space) is accepted as a legacy
   fallback. Folder names are case-sensitive. */
export const IMAGE_FOLDERS = ['Project_Card', 'Project Card'];
export const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif']);

/* File name (last path segment), for alphabetical sorting. */
export function baseName(path) {
  const i = path.lastIndexOf('/');
  return i === -1 ? path : path.slice(i + 1);
}

/* URL-encode every path segment (filenames may contain spaces). */
export function encodePath(path) {
  return path
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');
}

/**
 * One repo's recursive file tree. The same tree serves two jobs:
 * slideshow images (Project_Card folder) and Featured enrichment
 * (detecting `portfolio.json` / README.md at the root) — so the
 * enrichment costs 0 extra tree calls. On failure throws — the
 * caller falls back (API: no images for this repo; script:
 * previous snapshot's images).
 */
export async function fetchTreeForRepo(fetchJson, repoName, defaultBranch) {
  const tree = await fetchJson(
    `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/git/trees/${encodeURIComponent(defaultBranch)}?recursive=1`
  );
  if (!Array.isArray(tree.tree)) return [];
  return tree.tree;
}

/* Slideshow images from an already-fetched tree. */
export function imagesFromTree(tree, repoName, defaultBranch) {
  for (const folder of IMAGE_FOLDERS) {
    const prefix = `${folder}/`;
    const files = tree
      .filter((t) => t.type === 'blob' && t.path.startsWith(prefix))
      .map((t) => t.path)
      .filter((p) => IMAGE_EXTS.has(p.split('.').pop().toLowerCase()))
      .sort((a, b) => baseName(a).localeCompare(baseName(b), undefined, { numeric: true }));
    if (files.length > 0) {
      return files.map(
        (p) =>
          `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${repoName}/${defaultBranch}/${encodePath(p)}`
      );
    }
  }
  return [];
}

/* A root-level file in the tree, matched case-insensitively
   (README.md vs Readme.md); returns the exact path, or null. */
export function findRootFile(tree, fileName) {
  const lower = fileName.toLowerCase();
  const hit = tree.find((t) => t.type === 'blob' && t.path.toLowerCase() === lower);
  return hit ? hit.path : null;
}
