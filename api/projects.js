/**
 * GET /api/projects — live project list from GitHub, with the server-side
 * token (5,000 req/hr) so visitors' browsers never call the GitHub API
 * directly (the old unauthenticated browser path hit 403 on shared IPs).
 *
 * Response shape is EXACTLY the same as the build-time snapshot
 * `public/projects.json` produced by scripts/fetch-projects.mjs:
 *   { generatedAt, source: 'github-api', featured: [...], repos: [...] }
 * so the frontend treats both sources identically and can fall back to
 * the snapshot when this function is unavailable (e.g. on GitHub Pages,
 * where no function exists).
 *
 * Featured Projects: `featured` is the first 4 pinned repos (in pin
 * order, excluding this portfolio site itself), read via the GitHub
 * GraphQL API (`pinnedItems`; REST has no pin endpoint). Each featured
 * repo gets a `details` object { problem, solution, features,
 * contribution, tech, detailsSource } resolved by the repo-first
 * fallback chain in scripts/featuredDetails.mjs: the repo's own
 * `portfolio.json`, then its README.md sections, then the curated data
 * in src/data/portfolio.js, then the GitHub description. Re-pinning in
 * the GitHub web UI updates the site within the cache hour — no code
 * change, no manual curation. Enrichment runs for featured repos only
 * (max 4) and never fails the function: any enrichment failure falls
 * back silently, and a GraphQL failure just means featured = [].
 *
 * Caching: the code sets `Cache-Control: public, s-maxage=3600,
 * stale-while-revalidate=86400`, and Vercel's edge DOES honour it —
 * repeated plain fetches return the same generatedAt with a growing
 * Age (observed HITs up to ~7 min), so GitHub is hit ~once an hour
 * instead of on every visit. But Vercel rewrites the header the
 * client sees to `public, max-age=0, must-revalidate` — so do not
 * be surprised when curl shows max-age=0: the hour-long edge cache
 * is real, it is just not visible in the response header. (This
 * confused two audits before it was written down here.)
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

import { pickFeatured, resolveDetails } from '../scripts/featuredDetails.mjs';
import {
  EXCLUDED_REPOS,
  encodePath,
  imagesFromTree,
  findRootFile,
  fetchTreeForRepo,
} from '../scripts/githubHelpers.mjs';
import { GITHUB_USERNAME, processLanguages } from '../src/utils/githubShared.js';

/* Whole-operation budget — Vercel Hobby kills functions at 10s, so
   abort GitHub work at 8s and answer with a clean 502 instead. */
const OVERALL_TIMEOUT_MS = 8000;

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

  async function fetchText(url) {
    const r = await fetch(url, { headers, signal: controller.signal });
    if (!r.ok) {
      const err = new Error(`GitHub fetch ${r.status}`);
      err.status = r.status;
      throw err;
    }
    return r.text();
  }

  /* Pinned repo names via GraphQL (REST has no pin endpoint).
     Any failure → [] — the section degrades to the all-projects
     grid instead of failing the function. */
  async function fetchPinnedRepoNames() {
    try {
      const r = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          query: `query { user(login: "${GITHUB_USERNAME}") { pinnedItems(first: 6, types: REPOSITORY) { nodes { ... on Repository { name } } } } }`,
        }),
      });
      if (!r.ok) return [];
      const data = await r.json();
      const nodes = data?.data?.user?.pinnedItems?.nodes;
      if (!Array.isArray(nodes)) return [];
      return nodes.map((n) => n?.name).filter((n) => typeof n === 'string');
    } catch {
      return [];
    }
  }

  /* Case-study details for ONE featured repo (portfolio.json →
     README → curated → GitHub description). Never throws. */
  async function enrichFeaturedRepo(repo, tree, curated) {
    let portfolioJson = null;
    let readmeText = null;
    try {
      const portfolioPath = findRootFile(tree, 'portfolio.json');
      if (portfolioPath) {
        const raw = await fetchText(
          `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${repo.name}/${repo.default_branch}/${encodePath(portfolioPath)}`
        );
        try {
          portfolioJson = JSON.parse(raw);
        } catch {
          portfolioJson = null;
        }
      }
      if (!portfolioJson) {
        const readmePath = findRootFile(tree, 'README.md');
        if (readmePath) {
          readmeText = await fetchText(
            `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${repo.name}/${repo.default_branch}/${encodePath(readmePath)}`
          );
        }
      }
    } catch {
      /* Any enrichment step failing just falls through. */
    }
    return resolveDetails({ portfolioJson, readmeText, curated, repo });
  }

  try {
    /* Curated fallback data. Dynamic import with a try/catch so a
       bundling surprise here can never take down the function —
       worst case the chain just skips the curated layer. */
    let curated = [];
    try {
      const mod = await import('../src/data/portfolio.js');
      curated = Array.isArray(mod?.portfolio?.projects) ? mod.portfolio.projects : [];
    } catch {
      curated = [];
    }

    /* Repo list (paginated, newest push first) + pins in parallel. */
    const reposPromise = (async () => {
      let rawRepos = [];
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const batch = await fetchJson(
          `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&page=${page}&sort=pushed&direction=desc`
        );
        rawRepos = rawRepos.concat(batch);
        hasMore = batch.length === 100;
        page += 1;
      }
      return rawRepos
        .filter((r) => !r.fork && !EXCLUDED_REPOS.has(r.name.toLowerCase()))
        .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
    })();

    const [repos, pinnedNames] = await Promise.all([reposPromise, fetchPinnedRepoNames()]);
    const featured = pickFeatured(pinnedNames, repos);

    /* Languages + trees per repo, in parallel. One repo failing
       must not fail the whole response — it falls back to its
       primary language and no images (same as the build script). */
    const enriched = await Promise.all(
      repos.map(async (r) => {
        let languages;
        try {
          const raw = await fetchJson(
            `https://api.github.com/repos/${GITHUB_USERNAME}/${r.name}/languages`
          );
          languages = processLanguages(raw, r.language);
        } catch {
          languages = r.language ? [r.language] : [];
        }

        let tree = [];
        try {
          tree = await fetchTreeForRepo(fetchJson, r.name, r.default_branch);
        } catch {
          /* keep tree as [] — this repo gets no slideshow images */
        }
        const images = imagesFromTree(tree, r.name, r.default_branch);

        const entry = {
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
        return { entry, tree };
      })
    );

    /* Featured details (featured repos only, max 4). */
    const detailsByName = {};
    await Promise.all(
      featured.map(async (name) => {
        const found = enriched.find((e) => e.entry.name.toLowerCase() === name.toLowerCase());
        if (!found) return;
        detailsByName[found.entry.name] = await enrichFeaturedRepo(
          found.entry,
          found.tree,
          curated
        );
      })
    );
    for (const e of enriched) {
      if (detailsByName[e.entry.name]) e.entry.details = detailsByName[e.entry.name];
    }

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({
      generatedAt: new Date().toISOString(),
      source: 'github-api',
      featured,
      repos: enriched.map((e) => e.entry),
    });
  } catch (err) {
    /* Never leak the token or GitHub's response — log only the
       status code for debugging, answer with a generic 502. */
    console.error(
      '[api/projects] GitHub unavailable:',
      err?.name === 'AbortError' ? 'timeout' : err?.status || 'network'
    );
    return res.status(502).json({ error: 'github_unavailable' });
  } finally {
    clearTimeout(timer);
  }
}
