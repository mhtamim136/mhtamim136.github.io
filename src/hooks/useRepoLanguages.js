import { useState, useEffect, useRef, useMemo } from 'react';

const GITHUB_USERNAME = 'mhtamim136';
const CACHE_PREFIX = 'gh_langs_';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
const MIN_PERCENT = 2; // hide languages below 2% of total bytes

/**
 * Reads cached language data for a repo from localStorage.
 * Returns null if missing or expired.
 */
function readCache(repoName) {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${repoName}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(`${CACHE_PREFIX}${repoName}`);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function writeCache(repoName, data) {
  try {
    localStorage.setItem(
      `${CACHE_PREFIX}${repoName}`,
      JSON.stringify({ data, ts: Date.now() }),
    );
  } catch {
    /* localStorage full — non-critical */
  }
}

/**
 * Processes the raw { Language: bytes } object from the GitHub API.
 * - Filters out languages below MIN_PERCENT of total bytes
 * - Sorts by bytes descending (largest first)
 * - Returns an array of language name strings
 */
function processLanguages(raw) {
  const entries = Object.entries(raw); // [["Java", 12345], ...]
  if (entries.length === 0) return [];

  const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);
  return entries
    .filter(([, bytes]) => (bytes / total) * 100 >= MIN_PERCENT)
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang);
}

/**
 * Fetches a single repo's languages (with cache + fallback).
 */
async function fetchRepoLanguages(repoName, fallbackLanguage, signal) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/languages`,
      {
        signal,
        headers: { Accept: 'application/vnd.github.v3+json' },
      },
    );

    if (!res.ok) throw new Error(`${res.status}`);

    const raw = await res.json();
    const langs = processLanguages(raw);
    const result = langs.length > 0 ? langs : fallbackLanguage ? [fallbackLanguage] : [];
    writeCache(repoName, result);
    return result;
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    // Fallback to primary language on error / 403
    return fallbackLanguage ? [fallbackLanguage] : [];
  }
}

/**
 * Fetches detailed language breakdowns for a batch of repos.
 *
 * - Only fetches for the repo names passed in (lazy).
 * - Caches each repo's result in localStorage with a 6hr TTL.
 * - On 403 or network error, silently falls back to repo.language.
 *
 * Returns:
 *   langMap   — Record<repoName, string[]>
 *   loading   — Set<repoName>
 *   allLangs  — string[]  (sorted union across all repos)
 */
export function useRepoLanguages(visibleRepos) {
  // visibleRepos: Array<{ name: string, language: string | null }>

  const [langMap, setLangMap] = useState({});
  const [loading, setLoading] = useState(new Set());
  const fetched = useRef(new Set()); // repos we've already started fetching

  /* Stabilise the dependency: only re-run when the list of names changes,
     not when the array reference changes. */
  const repoKey = useMemo(
    () => visibleRepos.map((r) => r.name).join(','),
    [visibleRepos],
  );

  useEffect(() => {
    if (!visibleRepos || visibleRepos.length === 0) return;

    const controller = new AbortController();
    const toFetch = [];

    // First pass: serve from cache, identify what needs fetching
    const cacheUpdates = {};
    for (const repo of visibleRepos) {
      if (fetched.current.has(repo.name)) continue;

      const cached = readCache(repo.name);
      if (cached) {
        cacheUpdates[repo.name] = cached;
        fetched.current.add(repo.name);
        continue;
      }

      /* Do NOT mark as fetched yet: if this fetch is aborted
         (e.g. toggling Show All quickly), the repo must be retried
         on the next run instead of staying on fallback all session. */
      toFetch.push(repo);
    }

    // Apply cache hits immediately
    if (Object.keys(cacheUpdates).length > 0) {
      setLangMap((prev) => ({ ...prev, ...cacheUpdates }));
    }

    if (toFetch.length === 0) return;

    // Mark as loading
    setLoading((prev) => {
      const next = new Set(prev);
      toFetch.forEach((r) => next.add(r.name));
      return next;
    });

    // Fetch all in parallel
    let cancelled = false;

    Promise.allSettled(
      toFetch.map((repo) =>
        fetchRepoLanguages(repo.name, repo.language, controller.signal).then(
          (langs) => ({ name: repo.name, langs }),
        ),
      ),
    ).then((results) => {
      /* Clear loading for every repo we attempted — including aborted
         ones — so no card stays on the skeleton shimmer forever. */
      setLoading((prev) => {
        const next = new Set(prev);
        toFetch.forEach((r) => next.delete(r.name));
        return next;
      });

      if (cancelled) return;

      const updates = {};

      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) {
          updates[r.value.name] = r.value.langs;
          /* Only now mark as fetched — aborted/rejected repos stay
             retryable on the next effect run. */
          fetched.current.add(r.value.name);
        }
      }

      if (Object.keys(updates).length > 0) {
        setLangMap((prev) => ({ ...prev, ...updates }));
      }
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [repoKey]);

  // Compute the union of all languages across all loaded repos
  const allLangs = useMemo(() => {
    const set = new Set();
    for (const langs of Object.values(langMap)) {
      langs.forEach((l) => set.add(l));
    }
    return Array.from(set).sort();
  }, [langMap]);

  return { langMap, loading, allLangs };
}
