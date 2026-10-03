import { useState, useEffect } from 'react';

const GITHUB_USERNAME = 'mhtamim136';
const CACHE_KEY = `gh_repos_${GITHUB_USERNAME}`;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

/**
 * Repos to exclude from the projects grid.
 * Case-insensitive match on repo name.
 */
const EXCLUDED_REPOS = [
  'mhtamim136',              // GitHub profile README repo
  'mhtamim136.github.io',    // This portfolio site itself
];

/**
 * Fetches all public repos for a GitHub user.
 * - Excludes forks and configurable repo names.
 * - Sorts by most recently pushed.
 * - Caches in sessionStorage with a TTL to avoid
 *   hitting GitHub's unauthenticated rate limit (60/hr).
 *
 * Returns { repos, loading, error }.
 */
export function useGitHubRepos() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchRepos() {
      /* ── Check cache first ── */
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            setRepos(data);
            setLoading(false);
            return;
          }
        }
      } catch {
        /* corrupt cache — ignore */
      }

      /* ── Fetch from GitHub API ── */
      try {
        const excludeSet = new Set(EXCLUDED_REPOS.map((n) => n.toLowerCase()));

        let allRepos = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const url = `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&page=${page}&sort=pushed&direction=desc`;
          const res = await fetch(url, {
            signal: controller.signal,
            headers: { Accept: 'application/vnd.github.v3+json' },
          });

          if (!res.ok) {
            throw new Error(
              res.status === 403
                ? 'GitHub API rate limit reached. Projects will load from cache on next visit.'
                : `GitHub API error (${res.status})`,
            );
          }

          const batch = await res.json();
          allRepos = allRepos.concat(batch);

          /* GitHub paginates at 100. If we got fewer, we're done. */
          hasMore = batch.length === 100;
          page++;
        }

        /* Filter: no forks, no excluded names */
        const filtered = allRepos
          .filter((r) => !r.fork && !excludeSet.has(r.name.toLowerCase()))
          .map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            language: r.language,
            stars: r.stargazers_count,
            forks: r.forks_count,
            url: r.html_url,
            homepage: r.homepage || null,
            pushedAt: r.pushed_at,
            topics: r.topics || [],
          }));

        /* Cache the cleaned data */
        try {
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ data: filtered, timestamp: Date.now() }),
          );
        } catch {
          /* sessionStorage full or unavailable — non-critical */
        }

        setRepos(filtered);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchRepos();
    return () => controller.abort();
  }, []);

  return { repos, loading, error };
}
