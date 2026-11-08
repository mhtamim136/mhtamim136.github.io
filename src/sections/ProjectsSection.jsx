import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, GitFork, ExternalLink, Github, ChevronDown, ChevronUp } from 'lucide-react';
import { SectionWrapper } from '../components/SectionWrapper';
import { Card } from '../components/Card';
import { ProjectSlideshow } from '../components/ProjectSlideshow';
import { Button } from '../components/Button';
import { Tag } from '../components/Tag';
import { useGitHubRepos } from '../hooks/useGitHubRepos';
import { useRepoLanguages } from '../hooks/useRepoLanguages';
import { externalLinkProps } from '../utils/links';

/* Pagination: 4 cards by default (2 rows on desktop), then 4 more
   per "Show more" click. When 8 or fewer remain, the button becomes
   "Show all N projects" instead — so after 1–2 clicks the user can
   jump straight to the full list. */
const INITIAL_COUNT = 4;
const PAGE_SIZE = 4;
const SHOW_ALL_THRESHOLD = 8;
const MAX_PILLS = 4;

/* ── Skeleton loader ──────────────────────────────────────────── */
function ProjectSkeleton() {
  return (
    <div className="rounded-2xl border border-card bg-card p-6 sm:p-7">
      <div className="h-5 w-3/4 animate-pulse rounded bg-glass/[0.08]" />
      <div className="mt-4 space-y-2.5">
        <div className="h-3.5 w-full animate-pulse rounded bg-glass/[0.06]" />
        <div className="h-3.5 w-5/6 animate-pulse rounded bg-glass/[0.06]" />
      </div>
      <div className="mt-5 flex gap-2">
        <div className="h-6 w-14 animate-pulse rounded-md bg-glass/[0.06]" />
        <div className="h-6 w-16 animate-pulse rounded-md bg-glass/[0.06]" />
      </div>
      <div className="mt-6 flex gap-3">
        <div className="h-9 w-20 animate-pulse rounded-xl bg-glass/[0.06]" />
        <div className="h-9 w-20 animate-pulse rounded-xl bg-glass/[0.06]" />
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {Array.from({ length: INITIAL_COUNT }, (_, i) => (
        <ProjectSkeleton key={i} />
      ))}
    </div>
  );
}

/* ── Language pills ───────────────────────────────────────────── */
/* Same hover language as the accent Tag: a 1px lift and a deeper
   tint. Pills are labels, not links, so nothing here suggests a click. */
const pillClass =
  'rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-[0.6875rem] font-medium text-accent transition-all duration-200 hover:-translate-y-px hover:border-accent/50 hover:bg-accent/15';

function LanguagePills({ repoName, fallbackLanguage, langMap, loadingSet }) {
  const isLoading = loadingSet.has(repoName);
  const langs = langMap[repoName];

  /* Skeleton shimmer while loading */
  if (isLoading && !langs) {
    return (
      <div className="flex flex-wrap gap-1.5">
        <div className="h-5 w-12 animate-pulse rounded-md bg-glass/[0.08]" />
        <div className="h-5 w-10 animate-pulse rounded-md bg-glass/[0.06]" />
      </div>
    );
  }

  /* Resolved languages (or fallback) */
  const display = langs && langs.length > 0
    ? langs
    : fallbackLanguage
      ? [fallbackLanguage]
      : [];

  if (display.length === 0) return null;

  const shown = display.slice(0, MAX_PILLS);
  const overflow = display.length - MAX_PILLS;

  return (
    <motion.div
      className="flex flex-wrap gap-1.5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {shown.map((lang) => (
        <span key={lang} className={pillClass}>
          {lang}
        </span>
      ))}
      {overflow > 0 && (
        <span className={`${pillClass} opacity-70`}>
          +{overflow}
        </span>
      )}
    </motion.div>
  );
}

/* ── Language filter chip ─────────────────────────────────────── */
/* These ARE interactive (unlike the pills, which are labels), so the
   hover is allowed to be visible: a 1px lift, an accent-tinted fill
   and accent text — the same language as the Tag/pill hover from
   PR #11, one notch stronger because a click is a real action here.
   The old hover (text #475569 → #334155, border 10% → 25%) was so
   faint it read as no effect at all. The active chip already has
   shadow-accent-glow, so it stays distinct; it just deepens a touch. */
function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:text-sm ${
        active
          ? 'border-accent/40 bg-accent/15 text-accent shadow-accent-glow hover:bg-accent/20'
          : 'border-glass/10 bg-glass/[0.04] text-muted hover:-translate-y-px hover:border-accent/40 hover:bg-accent/10 hover:text-accent'
      }`}
    >
      {label}
    </button>
  );
}

/* ── Format repo name ─────────────────────────────────────────── */

/* "Oct 2026" style date for the card's Updated label. */
function formatUpdated(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatName(name) {
  return name
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── Project card item animation ──────────────────────────────── */
const cardAnim = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.05,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
  exit: { opacity: 0, y: -12, scale: 0.97, transition: { duration: 0.25 } },
};

/* ── Main component ───────────────────────────────────────────── */
export function ProjectsSection() {
  const { repos, loading, error } = useGitHubRepos();
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [activeLanguage, setActiveLanguage] = useState('All');

  /* Determine the visible slice BEFORE filtering by language,
     so we know which repos to fetch languages for. */
  const visibleSlice = repos.slice(0, visibleCount);

  /* Languages that already ship with the repos (build-time snapshot
     `public/projects.json` carries a `languages` array per repo).
     For those, no runtime GitHub call is needed at all.
     NOTE: an EMPTY array is also complete — some repos (e.g. BuyTrust)
     have no code language at all (primary: null, languages: []).
     Treating [] as "missing" caused a runtime languages fetch that
     403'd on a rate-limited IP and logged a console error. */
  const staticLangMap = useMemo(() => {
    const map = {};
    for (const r of repos) {
      if (Array.isArray(r.languages)) {
        map[r.name] = r.languages;
      }
    }
    return map;
  }, [repos]);

  /* Only fetch languages for visible repos that did NOT come with
     languages (i.e. when the snapshot was missing and the live API
     was used). The hook memoizes internally and won't re-fetch
     already-loaded repos. */
  const {
    langMap: fetchedLangMap,
    loading: langLoading,
    allLangs: fetchedAllLangs,
  } = useRepoLanguages(
    visibleSlice
      .filter((r) => !Array.isArray(r.languages))
      .map((r) => ({ name: r.name, language: r.language })),
  );

  /* Merge: snapshot languages + any runtime-fetched ones. */
  const langMap = useMemo(
    () => ({ ...staticLangMap, ...fetchedLangMap }),
    [staticLangMap, fetchedLangMap],
  );

  /* Filter chips come from the union of ALL repos' languages — not
     just the visible slice — so a language that only exists in repos
     7+ always has a chip (previously chips only covered the first 6). */
  const allLangs = useMemo(() => {
    const set = new Set(fetchedAllLangs);
    for (const langs of Object.values(staticLangMap)) {
      langs.forEach((l) => set.add(l));
    }
    return Array.from(set).sort();
  }, [staticLangMap, fetchedAllLangs]);

  /* Build filter chip list from the union of all loaded languages */
  const languages = useMemo(() => {
    if (allLangs.length === 0) return ['All'];
    return ['All', ...allLangs];
  }, [allLangs]);

  /* Filter repos using the full language list (not just primary) */
  const filtered = useMemo(() => {
    if (activeLanguage === 'All') return repos;
    return repos.filter((r) => {
      const langs = langMap[r.name];
      if (langs) return langs.includes(activeLanguage);
      // Fallback to primary language if not yet loaded
      return r.language === activeLanguage;
    });
  }, [repos, activeLanguage, langMap]);

  /* Pagination on the filtered list */
  const visible = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visibleCount;

  /* "Show less" removes whole rows below, but the browser keeps the
     same absolute scroll position — which then points at Experience /
     Services / Contact instead of Projects. Scroll back to the
     Projects heading instead. The section top never moves during the
     collapse (cards are removed from below it), so the target computed
     here stays valid while the exit animation runs. */
  const handleShowLess = () => {
    const el = document.getElementById('projects');
    setVisibleCount(INITIAL_COUNT);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 96;
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <SectionWrapper
      id="projects"
      title="Projects"
      subtitle="Auto-synced from GitHub — what I've been building."
    >
      {/* Faint emerald glow near Projects — same restraint as the hero. */}
      <div className="pointer-events-none absolute inset-0 bg-projects-glow" aria-hidden />
      {/* Loading state */}
      {loading && <SkeletonGrid />}

      {/* Error state */}
      {error && !loading && (
        <div className="rounded-2xl border border-card bg-card p-8 text-center">
          <p className="text-sm text-muted">{error}</p>
          <p className="mt-2 text-xs text-muted-dim">
            Projects are cached — they'll appear on your next visit.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && repos.length === 0 && (
        <div className="rounded-2xl border border-card bg-card p-8 text-center">
          <p className="text-sm text-muted">No public repositories found.</p>
        </div>
      )}

      {/* Content */}
      {!loading && !error && repos.length > 0 && (
        <>
          {/* Language filter chips */}
          {languages.length > 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
              className="mb-8 flex flex-wrap gap-2"
            >
              {languages.map((lang) => (
                <FilterChip
                  key={lang}
                  label={lang}
                  active={activeLanguage === lang}
                  onClick={() => {
                    setActiveLanguage(lang);
                    setVisibleCount(INITIAL_COUNT);
                  }}
                />
              ))}
            </motion.div>
          )}

          {/* Project grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {visible.map((repo, idx) => (
                <motion.div
                  key={repo.id}
                  custom={idx}
                  variants={cardAnim}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  layout
                >
                  <Card
                    spotlight
                    className="flex h-full flex-col overflow-hidden p-6 sm:p-7"
                    whileHover={{ y: -6, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Slideshow — only when the repo has a `Project_Card`
                        folder (images come from the build-time snapshot).
                        Without images the card renders exactly as before:
                        text-only, same layout, no empty image box. */}
                    {Array.isArray(repo.images) && repo.images.length > 0 && (
                      <ProjectSlideshow images={repo.images} repoName={repo.name} />
                    )}

                    {/* Title + language pills */}
                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                      <h3 className="text-lg font-semibold text-heading sm:text-xl">
                        {formatName(repo.name)}
                      </h3>
                      <LanguagePills
                        repoName={repo.name}
                        fallbackLanguage={repo.language}
                        langMap={langMap}
                        loadingSet={langLoading}
                      />
                    </div>

                    {/* Description — clamped to 3 lines so cards with a
                        slideshow stay equal height. No description means
                        no line at all (never invent one). */}
                    {repo.description && (
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
                        {repo.description}
                      </p>
                    )}

                    {/* Topics as tags */}
                    {repo.topics.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {repo.topics.slice(0, 6).map((t) => (
                          <Tag key={t}>{t}</Tag>
                        ))}
                      </div>
                    )}

                    {/* Stats row */}
                    <div className="mt-4 flex items-center gap-4 text-xs text-muted-dim">
                      {formatUpdated(repo.pushedAt) && (
                        <span>Updated {formatUpdated(repo.pushedAt)}</span>
                      )}
                      {repo.stars > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5" aria-hidden />
                          {repo.stars}
                        </span>
                      )}
                      {repo.forks > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <GitFork className="h-3.5 w-3.5" aria-hidden />
                          {repo.forks}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-auto flex flex-wrap gap-3 pt-6">
                      {repo.homepage && (
                        <Button
                          {...externalLinkProps(repo.homepage)}
                          variant="primary"
                          className="flex-1 sm:flex-none"
                        >
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                          Live demo
                        </Button>
                      )}
                      <Button {...externalLinkProps(repo.url)} variant="secondary">
                        <Github className="h-3.5 w-3.5" aria-hidden />
                        GitHub
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Show more / Show all / Show less */}
          {filtered.length > INITIAL_COUNT && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-8 text-center"
            >
              <div className="flex flex-wrap items-center justify-center gap-3">
                {/* Back to the first 4 — only once expanded. */}
                {visibleCount > INITIAL_COUNT && (
                  <button
                    type="button"
                    onClick={handleShowLess}
                    className="group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-muted transition-all duration-300 hover:text-accent"
                  >
                    Show less
                    <ChevronUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" aria-hidden />
                  </button>
                )}
                {/* +4 per click; when few remain, jump to the full list. */}
                {remaining > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount((c) =>
                        remaining > SHOW_ALL_THRESHOLD
                          ? c + PAGE_SIZE
                          : filtered.length,
                      )
                    }
                    className="group inline-flex items-center gap-2 rounded-xl border border-glass/10 bg-glass/[0.04] px-6 py-2.5 text-sm font-medium text-muted transition-all duration-300 hover:border-accent/25 hover:text-accent"
                  >
                    {remaining > SHOW_ALL_THRESHOLD ? (
                      <>
                        Show more
                        <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" aria-hidden />
                      </>
                    ) : (
                      <>
                        Show all {filtered.length} projects
                        <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" aria-hidden />
                      </>
                    )}
                  </button>
                )}
              </div>
              <p className="mt-3 text-xs text-muted-dim">
                Showing {visible.length} of {filtered.length} projects
              </p>
            </motion.div>
          )}
        </>
      )}
    </SectionWrapper>
  );
}
