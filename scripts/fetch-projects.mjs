/**
 * Fetches the public repo list (+ per-repo languages + per-repo
 * "Project Card" images) from GitHub and writes a static snapshot
 * to `public/projects.json`.
 *
 * Why this exists: the site used to call the unauthenticated GitHub API
 * from every visitor's browser (1 repos call + 1 languages call per
 * repo ≈ 22 calls, against a 60/hr per-IP limit). On shared IPs that
 * hit 403 and the Projects section broke. With this snapshot the site
 * serves projects from a static file — zero runtime GitHub API calls —
 * and only falls back to the live API if the snapshot is missing.
 *
 * Project images: for each repo this also reads the repo's file tree
 * once and looks for an image folder named exactly `Project_Card`
 * (preferred) or `Project Card` (legacy, with a space) at the repo
 * root. Image URLs are written into the snapshot as `images`, so the
 * live site makes ZERO extra API calls for images either. A repo
 * without such a folder gets `images: []` and its card renders
 * exactly as before (text-only).
 *
 * How it runs:
 * - `npm run fetch-projects` — manual refresh.
 * - `prebuild` (npm runs it automatically before `npm run build`), so
 *   every deploy ships a fresh snapshot. In GitHub Actions it uses the
 *   built-in GITHUB_TOKEN (5,000 req/hr), so it never hits the
 *   unauthenticated limit there.
 *
 * Safety rules (so this can never break a build):
 * - On ANY fetch failure it warns and exits 0, keeping the previous
 *   snapshot (or no snapshot, in which case the site falls back to
 *   the live API at runtime).
 * - A single repo's languages/images failing must not fail the whole
 *   snapshot — that repo falls back to its primary language and to
 *   the images from the previous snapshot (if any).
 * - It only rewrites `public/projects.json` when the repo data actually
 *   changed, so `npm run build` does not dirty git on every build.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GITHUB_USERNAME = 'mhtamim136';
const MIN_PERCENT = 2; // hide languages below 2% of total bytes

const EXCLUDED_REPOS = new Set([
  'mhtamim136', // GitHub profile README repo
  'mhtamim136.github.io', // This portfolio site itself
]);

/* Image folders for project-card slideshows. `Project_Card` is the
   convention; `Project Card` (with a space) is accepted as a legacy
   fallback. Folder names are case-sensitive. */
const IMAGE_FOLDERS = ['Project_Card', 'Project Card'];
const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif']);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outPath = join(root, 'public', 'projects.json');

const headers = {
  Accept: 'application/vnd.github.v3+json',
  'User-Agent': 'murad-portfolio-fetch-projects',
};
if (process.env.GITHUB_TOKEN) {
  headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} for ${url}`);
  }
  return res.json();
}

function processLanguages(raw, fallbackLanguage) {
  const entries = Object.entries(raw || {});
  if (entries.length === 0) {
    return fallbackLanguage ? [fallbackLanguage] : [];
  }
  const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);
  const langs = entries
    .filter(([, bytes]) => (bytes / total) * 100 >= MIN_PERCENT)
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang);
  return langs.length > 0 ? langs : fallbackLanguage ? [fallbackLanguage] : [];
}

/* File name (last path segment), for alphabetical sorting. */
function baseName(path) {
  const i = path.lastIndexOf('/');
  return i === -1 ? path : path.slice(i + 1);
}

/* URL-encode every path segment (filenames may contain spaces). */
function encodePath(path) {
  return path
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');
}

/**
 * Find slideshow images for one repo: read the repo's file tree once
 * and collect image files under `Project_Card/` (or `Project Card/`),
 * sorted alphabetically by filename, as raw.githubusercontent.com URLs.
 * Returns [] when the repo has no such folder (or no images in it).
 * On failure throws — the caller falls back to the previous snapshot's
 * images for this repo, so a rate-limited run never wipes the manifest.
 */
async function fetchImagesForRepo(repoName, defaultBranch) {
  const tree = await fetchJson(
    `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/git/trees/${encodeURIComponent(defaultBranch)}?recursive=1`,
  );
  if (!Array.isArray(tree.tree)) return [];

  for (const folder of IMAGE_FOLDERS) {
    const prefix = `${folder}/`;
    const files = tree.tree
      .filter((t) => t.type === 'blob' && t.path.startsWith(prefix))
      .map((t) => t.path)
      .filter((p) => IMAGE_EXTS.has(p.split('.').pop().toLowerCase()))
      .sort((a, b) => baseName(a).localeCompare(baseName(b)));
    if (files.length > 0) {
      return files.map(
        (p) =>
          `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${repoName}/${defaultBranch}/${encodePath(p)}`,
      );
    }
  }
  return [];
}

async function main() {
  /* Previous snapshot (if any) — used only as a per-repo fallback so a
     partially-failed run never wipes data we already had. */
  let prevByName = {};
  if (existsSync(outPath)) {
    try {
      const prev = JSON.parse(readFileSync(outPath, 'utf8'));
      for (const r of prev.repos || []) prevByName[r.name] = r;
    } catch {
      /* Corrupt/old snapshot — ignore, we rebuild below. */
    }
  }

  let rawRepos = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const batch = await fetchJson(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&page=${page}&sort=pushed&direction=desc`,
    );
    rawRepos = rawRepos.concat(batch);
    hasMore = batch.length === 100;
    page += 1;
  }

  const repos = rawRepos
    .filter((r) => !r.fork && !EXCLUDED_REPOS.has(r.name.toLowerCase()))
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));

  /* Languages: one call per repo, in parallel. A single repo failing
     must not fail the whole snapshot — fall back to its primary. */
  const languagesList = await Promise.all(
    repos.map(async (r) => {
      try {
        const raw = await fetchJson(
          `https://api.github.com/repos/${GITHUB_USERNAME}/${r.name}/languages`,
        );
        return processLanguages(raw, r.language);
      } catch (err) {
        console.warn(`[fetch-projects] languages failed for ${r.name}: ${err.message}`);
        return r.language ? [r.language] : [];
      }
    }),
  );

  /* Project images: one tree call per repo, in parallel. A single repo
     failing keeps its previous images (if any) instead of wiping them. */
  const imagesList = await Promise.all(
    repos.map(async (r) => {
      try {
        return await fetchImagesForRepo(r.name, r.default_branch);
      } catch (err) {
        console.warn(`[fetch-projects] images failed for ${r.name}: ${err.message}`);
        return Array.isArray(prevByName[r.name]?.images)
          ? prevByName[r.name].images
          : [];
      }
    }),
  );

  const snapshotRepos = repos.map((r, i) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    language: r.language,
    languages: languagesList[i],
    default_branch: r.default_branch,
    images: imagesList[i],
    stars: r.stargazers_count,
    forks: r.forks_count,
    url: r.html_url,
    homepage: r.homepage || null,
    pushedAt: r.pushed_at,
    topics: r.topics || [],
  }));

  /* Only rewrite when the data changed — keeps `git status` clean
     after a build where nothing changed on GitHub. */
  if (existsSync(outPath)) {
    try {
      const prev = JSON.parse(readFileSync(outPath, 'utf8'));
      if (JSON.stringify(prev.repos) === JSON.stringify(snapshotRepos)) {
        console.log('[fetch-projects] projects.json is already up to date.');
        return;
      }
    } catch {
      /* Corrupt/old snapshot — rewrite it below. */
    }
  }

  writeFileSync(
    outPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: 'github-api',
        repos: snapshotRepos,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );
  console.log(`[fetch-projects] wrote ${snapshotRepos.length} repos to public/projects.json`);
}

try {
  await main();
} catch (err) {
  /* Never break the build: warn, keep the old snapshot (if any),
     and let the site fall back to the live API at runtime. */
  console.warn(`[fetch-projects] WARNING: ${err.message} — keeping previous projects.json (if any).`);
  process.exit(0);
}
