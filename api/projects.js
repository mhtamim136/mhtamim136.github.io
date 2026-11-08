/**
 * GET /api/projects — live project list from GitHub, with the server-side
 * token (5,000 req/hr) so visitors' browsers never call the GitHub API
 * directly (the old unauthenticated browser path hit 403 on shared IPs).
 *
 * Response shape is EXACTLY the same as the build-time snapshot
 * `public/projects.json` produced by scripts/fetch-projects.mjs:
 *   { generatedAt, source: 'github-api', repos: [...] }
 * so the frontend treats both sources identically and can fall back to
 * the snapshot when this function is unavailable (e.g. on GitHub Pages,
 * where no function exists).
 *
 * Caching: `Cache-Control: public, s-maxage=3600,
 * stale-while-revalidate=86400` — Vercel's CDN serves the response for
 * an hour and revalidates in the background, so GitHub is hit ~once an
 * hour instead of on every visit.
 *
 * Errors: any GitHub failure → 502 {error:'github_unavailable'}.
 * The token and GitHub's response bodies are never exposed.
 *
 * Env: GITHUB_TOKEN (fine-grained PAT, read-only).
 *   Permissions needed: Contents (read-only) — the languages and
 *   git/trees endpoints are read operations under Contents;
 *   Repository metadata (read-only) — the repos list endpoint.
 *   Repository access: only this user's public repos are read; the
 *   token can be scoped to "All repositories" (read-only) or to the
 *   17 project repos. No write permission anywhere.
 */

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

/* Whole-operation budget — Vercel Hobby kills functions at 10s, so
   abort GitHub work at 8s and answer with a clean 502 instead. */
const OVERALL_TIMEOUT_MS = 8000;

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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(503).json({ error: 'not_configured' });
  }

  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'murad-portfolio-api-projects',
    Authorization: `Bearer ${token}`,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OVERALL_TIMEOUT_MS);

  async function fetchJson(url) {
    const r = await fetch(url, { headers, signal: controller.signal });
    if (!r.ok) {
      const err = new Error(`GitHub API ${r.status}`);
      err.status = r.status;
      throw err;
    }
    return r.json();
  }

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

  try {
    /* Repo list (paginated, newest push first). */
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

    /* Languages + images per repo, in parallel. One repo failing
       must not fail the whole response — it falls back to its
       primary language and no images (same as the build script). */
    const enriched = await Promise.all(
      repos.map(async (r) => {
        let languages;
        try {
          const raw = await fetchJson(
            `https://api.github.com/repos/${GITHUB_USERNAME}/${r.name}/languages`,
          );
          languages = processLanguages(raw, r.language);
        } catch {
          languages = r.language ? [r.language] : [];
        }

        let images = [];
        try {
          images = await fetchImagesForRepo(r.name, r.default_branch);
        } catch {
          images = [];
        }

        return {
          id: r.id,
          name: r.name,
          description: r.description,
          language: r.language,
          languages,
          default_branch: r.default_branch,
          images,
          stars: r.stargazers_count,
          forks: r.forks_count,
          url: r.html_url,
          homepage: r.homepage || null,
          pushedAt: r.pushed_at,
          topics: r.topics || [],
        };
      }),
    );

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=86400',
    );
    return res.status(200).json({
      generatedAt: new Date().toISOString(),
      source: 'github-api',
      repos: enriched,
    });
  } catch (err) {
    /* Never leak the token or GitHub's response — log only the
       status code for debugging, answer with a generic 502. */
    console.error(
      '[api/projects] GitHub unavailable:',
      err?.name === 'AbortError' ? 'timeout' : err?.status || 'network',
    );
    return res.status(502).json({ error: 'github_unavailable' });
  } finally {
    clearTimeout(timer);
  }
}
