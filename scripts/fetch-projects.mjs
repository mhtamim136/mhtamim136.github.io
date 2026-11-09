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
 * Featured Projects: the snapshot also carries `featured` — the first
 * 4 pinned repos (in pin order, excluding this portfolio site itself),
 * read via the GitHub GraphQL API (`pinnedItems`; REST has no pin
 * endpoint). Each featured repo gets a `details` object
 * { problem, solution, features, contribution, tech, detailsSource }
 * resolved by the repo-first fallback chain in
 * scripts/featuredDetails.mjs: the repo's own `portfolio.json`,
 * then its README.md sections, then the curated data in
 * src/data/portfolio.js, then the GitHub description. Re-pinning in
 * the GitHub web UI updates the site on the next build — no code
 * change, no manual curation. Enrichment runs for featured repos
 * only (max 4), and any enrichment failure falls back silently —
 * the snapshot is never blocked by it.
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
import { portfolio } from '../src/data/portfolio.js';
import { pickFeatured, resolveDetails } from './featuredDetails.mjs';
import { GITHUB_USERNAME, processLanguages } from '../src/utils/githubShared.js';

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

async function fetchText(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`GitHub fetch ${res.status} for ${url}`);
  }
  return res.text();
}

/**
 * Pinned repo names (in pin order) via the GraphQL API — REST has no
 * pin endpoint. Returns null when the pins CANNOT be read (no token,
 * or the query failed) — the caller must then keep the previous
 * featured list instead of clobbering it with []. Returns [] only
 * when the query succeeded and found no pins.
 */
async function fetchPinnedRepoNames() {
  if (!process.env.GITHUB_TOKEN) {
    console.warn(
      '[fetch-projects] WARNING: no GITHUB_TOKEN — pinned repos cannot be read; keeping the previous featured list.',
    );
    return null;
  }
  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `query { user(login: "${GITHUB_USERNAME}") { pinnedItems(first: 6, types: REPOSITORY) { nodes { ... on Repository { name } } } } }`,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const nodes = data?.data?.user?.pinnedItems?.nodes;
    if (!Array.isArray(nodes)) return null;
    return nodes.map((n) => n?.name).filter((n) => typeof n === 'string');
  } catch (err) {
    console.warn(`[fetch-projects] pinned repos failed: ${err.message}`);
    return null;
  }
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
 * One repo's recursive file tree. The same tree serves two jobs:
 * slideshow images (Project_Card folder) and Featured enrichment
 * (detecting `portfolio.json` / README.md at the root) — so the
 * enrichment costs 0 extra tree calls. On failure throws — the
 * caller falls back to the previous snapshot's images for this repo.
 */
async function fetchTreeForRepo(repoName, defaultBranch) {
  const tree = await fetchJson(
    `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/git/trees/${encodeURIComponent(defaultBranch)}?recursive=1`,
  );
  if (!Array.isArray(tree.tree)) return [];
  return tree.tree;
}

/* Slideshow images from an already-fetched tree. */
function imagesFromTree(tree, repoName, defaultBranch) {
  for (const folder of IMAGE_FOLDERS) {
    const prefix = `${folder}/`;
    const files = tree
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

/* A root-level file in the tree, matched case-insensitively
   (README.md vs Readme.md); returns the exact path, or null. */
function findRootFile(tree, fileName) {
  const lower = fileName.toLowerCase();
  const hit = tree.find(
    (t) => t.type === 'blob' && t.path.toLowerCase() === lower,
  );
  return hit ? hit.path : null;
}

/**
 * Case-study details for ONE featured repo, via the fallback chain
 * (portfolio.json → README → curated → GitHub description).
 * Any step failing just falls through to the next — enrichment
 * never throws, so it can never break the snapshot.
 */
async function enrichFeaturedRepo(repo, tree) {
  let portfolioJson = null;
  let readmeText = null;
  try {
    const portfolioPath = findRootFile(tree, 'portfolio.json');
    if (portfolioPath) {
      const raw = await fetchText(
        `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${repo.name}/${repo.default_branch}/${encodePath(portfolioPath)}`,
      );
      try {
        portfolioJson = JSON.parse(raw);
      } catch {
        /* Invalid JSON = treat as absent. */
        portfolioJson = null;
      }
    }
    if (!portfolioJson) {
      const readmePath = findRootFile(tree, 'README.md');
      if (readmePath) {
        readmeText = await fetchText(
          `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${repo.name}/${repo.default_branch}/${encodePath(readmePath)}`,
        );
      }
    }
  } catch (err) {
    console.warn(`[fetch-projects] details failed for ${repo.name}: ${err.message}`);
  }
  return resolveDetails({
    portfolioJson,
    readmeText,
    curated: portfolio.projects || [],
    repo,
  });
}

async function main() {
  /* Previous snapshot (if any) — used only as a per-repo fallback so a
     partially-failed run never wipes data we already had. */
  let prevByName = {};
  let prevFeatured = [];
  if (existsSync(outPath)) {
    try {
      const prev = JSON.parse(readFileSync(outPath, 'utf8'));
      for (const r of prev.repos || []) prevByName[r.name] = r;
      if (Array.isArray(prev.featured)) prevFeatured = prev.featured;
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

  /* Pinned repos (GraphQL; null when the pins could not be read).
     A token-less or failed pins query must NEVER clobber a good
     featured list with [] — keep the previous list instead. Only a
     query that SUCCEEDED and found no pins yields featured = []. */
  const pinnedNames = await fetchPinnedRepoNames();
  let featured;
  if (pinnedNames === null) {
    featured = prevFeatured;
    console.warn(
      `[fetch-projects] WARNING: pinned repos unreadable — keeping previous featured list (${featured.length} repos).`,
    );
  } else {
    featured = pickFeatured(pinnedNames, repos);
  }

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
        /* Keep the previous breakdown (e.g. ["C", "C++"]) instead of
           collapsing to the primary language only. */
        const prevLangs = prevByName[r.name]?.languages;
        if (Array.isArray(prevLangs) && prevLangs.length > 0) return prevLangs;
        return r.language ? [r.language] : [];
      }
    }),
  );

  /* File trees: one call per repo, in parallel. A single repo
     failing keeps its previous images (if any) instead of wiping
     them. The tree is reused for Featured enrichment below. */
  const treesList = await Promise.all(
    repos.map(async (r) => {
      try {
        return await fetchTreeForRepo(r.name, r.default_branch);
      } catch (err) {
        console.warn(`[fetch-projects] tree failed for ${r.name}: ${err.message}`);
        return null;
      }
    }),
  );

  const imagesList = treesList.map((tree, i) =>
    tree ? imagesFromTree(tree, repos[i].name, repos[i].default_branch) : [],
  );
  /* A repo whose tree failed keeps its previous images (if any). */
  for (let i = 0; i < repos.length; i += 1) {
    if (treesList[i] === null && Array.isArray(prevByName[repos[i].name]?.images)) {
      imagesList[i] = prevByName[repos[i].name].images;
    }
  }

  /* Featured details: enrichment runs for featured repos only
     (max MAX_FEATURED). Each step falls back silently. */
  const detailsByName = {};
  await Promise.all(
    featured.map(async (name) => {
      const idx = repos.findIndex((r) => r.name.toLowerCase() === name.toLowerCase());
      if (idx === -1) return;
      const tree = treesList[idx];
      if (!tree) {
        /* No tree — keep the previous case-study details (if any)
           instead of re-deriving a thinner set from curated/GitHub
           only; fall back to the chain only when there is nothing
           to keep. */
        const prevDetails = prevByName[repos[idx].name]?.details;
        if (prevDetails) {
          detailsByName[repos[idx].name] = prevDetails;
          return;
        }
        detailsByName[repos[idx].name] = resolveDetails({
          portfolioJson: null,
          readmeText: null,
          curated: portfolio.projects || [],
          repo: repos[idx],
        });
        return;
      }
      detailsByName[repos[idx].name] = await enrichFeaturedRepo(repos[idx], tree);
    }),
  );

  const snapshotRepos = repos.map((r, i) => {
    const entry = {
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
    };
    if (detailsByName[r.name]) entry.details = detailsByName[r.name];
    return entry;
  });

  /* Only rewrite when the data changed — keeps `git status` clean
     after a build where nothing changed on GitHub. */
  if (existsSync(outPath)) {
    try {
      const prev = JSON.parse(readFileSync(outPath, 'utf8'));
      if (
        JSON.stringify(prev.featured || []) === JSON.stringify(featured) &&
        JSON.stringify(prev.repos) === JSON.stringify(snapshotRepos)
      ) {
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
        featured,
        repos: snapshotRepos,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );
  console.log(
    `[fetch-projects] wrote ${snapshotRepos.length} repos (${featured.length} featured) to public/projects.json`,
  );
}

try {
  await main();
} catch (err) {
  /* Never break the build: warn, keep the old snapshot (if any),
     and let the site fall back to the live API at runtime. */
  console.warn(`[fetch-projects] WARNING: ${err.message} — keeping previous projects.json (if any).`);
  process.exit(0);
}
