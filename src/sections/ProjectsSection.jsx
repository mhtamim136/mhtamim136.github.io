import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, GitFork, ExternalLink, Github, ChevronDown, ChevronUp } from 'lucide-react';
import { SectionWrapper } from '../components/SectionWrapper';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Tag } from '../components/Tag';
import { useGitHubRepos } from '../hooks/useGitHubRepos';
import { externalLinkProps } from '../utils/links';

const INITIAL_COUNT = 6;

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

/* ── Language filter chip ─────────────────────────────────────── */
function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:text-sm ${
        active
          ? 'border-accent/40 bg-accent/15 text-accent shadow-accent-glow'
          : 'border-glass/10 bg-glass/[0.04] text-muted hover:border-accent/25 hover:text-subtle'
      }`}
    >
      {label}
    </button>
  );
}

/* ── Format repo name ─────────────────────────────────────────── */
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
  const [showAll, setShowAll] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState('All');

  /* Collect unique languages for filter chips */
  const languages = useMemo(() => {
    const set = new Set();
    repos.forEach((r) => {
      if (r.language) set.add(r.language);
    });
    return ['All', ...Array.from(set).sort()];
  }, [repos]);

  /* Filtered repos */
  const filtered = useMemo(() => {
    if (activeLanguage === 'All') return repos;
    return repos.filter((r) => r.language === activeLanguage);
  }, [repos, activeLanguage]);

  /* Pagination */
  const visible = showAll ? filtered : filtered.slice(0, INITIAL_COUNT);
  const hasMore = filtered.length > INITIAL_COUNT;

  return (
    <SectionWrapper
      id="projects"
      title="Projects"
      subtitle="Auto-synced from GitHub — what I've been building."
    >
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
                    setShowAll(false);
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
                    className="flex h-full flex-col p-6 sm:p-7"
                    whileHover={{ y: -6, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Title + language badge */}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold text-heading sm:text-xl">
                        {formatName(repo.name)}
                      </h3>
                      {repo.language && (
                        <span className="mt-0.5 shrink-0 rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-[0.6875rem] font-medium text-accent">
                          {repo.language}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {repo.description && (
                      <p className="mt-3 text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
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

          {/* Show more / less */}
          {hasMore && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-8 text-center"
            >
              <button
                type="button"
                onClick={() => setShowAll((s) => !s)}
                className="group inline-flex items-center gap-2 rounded-xl border border-glass/10 bg-glass/[0.04] px-6 py-2.5 text-sm font-medium text-muted transition-all duration-300 hover:border-accent/25 hover:text-accent"
              >
                {showAll ? (
                  <>
                    Show less
                    <ChevronUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" aria-hidden />
                  </>
                ) : (
                  <>
                    Show all {filtered.length} projects
                    <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" aria-hidden />
                  </>
                )}
              </button>
            </motion.div>
          )}
        </>
      )}
    </SectionWrapper>
  );
}
