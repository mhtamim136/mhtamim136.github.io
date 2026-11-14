import { useState, useEffect, useMemo, useRef, memo, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Star,
  GitFork,
  ExternalLink,
  Github,
  ChevronDown,
  ChevronUp,
  Check,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
} from 'lucide-react';
import { SectionWrapper } from '../components/SectionWrapper';
import { Card } from '../components/Card';
import { ProjectSlideshow } from '../components/ProjectSlideshow';
import { YearDropdown } from '../components/YearDropdown';
import { Button } from '../components/Button';
/* Shared hover fill: the card buttons reuse the hero/footer
   left-to-right cyan wipe (HeroCtaFill.css) — Live demo (primary)
   is --solid, GitHub (secondary) is --ghost, exactly like the
   hero's three buttons. Same 550ms, same #22D3EE, same #062A33 flip. */
import './HeroCtaFill.css';
import { Tag } from '../components/Tag';
import { portfolio } from '../data/portfolio';
import { normalizeKey, getRepoKeys, findSkillByKey } from '../utils/skillProjectCounts';
import { externalLinkProps } from '../utils/links';
import { smoothScrollTo } from '../utils/smoothScroll';
import { NAV_OFFSET_PX } from '../utils/navOffset';
import { useMediaQuery } from '../hooks/useMediaQuery';

/* Pagination — two states, one shared list (`filtered`):
   - ALL (no filter): Featured first, More collapsed (0 visible).
     "Show N more projects" reveals 4 more per click; "Show less"
     appears as soon as the list is expanded and collapses back to
     Featured only. When every More repo is shown, only "Show less"
     remains.
   - FILTERED (a chip or skill pill is active): one flat grid of ALL
     matching repos (featured + more), first 4, then 4 more per
     click; "Show less" appears once expanded and goes back to the
     first 4. Changing the filter resets to the first batch.
   No "Show all N" jump: every click reveals exactly 4, so the
   button label always shows the honest remaining count. */
const INITIAL_COUNT = 4;
const PAGE_SIZE = 4;
const MAX_PILLS = 4;
/* Session key for the persisted "Show more" expansion (Tamim,
   2026-11-09) — the number of More projects shown, so a reload
   no longer collapses the grid back to Featured-only. sessionStorage
   (not localStorage): the expansion belongs to this tab's session —
   a new tab starts collapsed, as before. */
const SHOW_MORE_KEY = 'portfolio_projects_visible_count';

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

/* Languages come from the repos data itself (snapshot + /api/projects
   both carry a `languages` array per repo) — no runtime fetch. A repo
   without a languages array falls back to its primary language. */
/* Memoized (P7): a parent re-render (scroll-spy, theme) passes the
   same repoName / fallbackLanguage / langMap, so the pills must not
   re-render for it. */
const LanguagePills = memo(function LanguagePills({
  repoName,
  fallbackLanguage,
  langMap,
  langs: langsOverride,
}) {
  const reduceMotion = useReducedMotion() ?? false;
  /* W25: `langs` override — the Featured card passes its resolved
     `tech` array (curated tech first, else languages) so the
     slice + overflow rule lives in exactly one place. When the
     override is present it is used as-is, even when empty. */
  const langs = langsOverride ?? (langMap ? langMap[repoName] : undefined);

  /* Resolved languages (or fallback) */
  const display =
    langsOverride !== undefined
      ? langsOverride
      : langs && langs.length > 0
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
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {shown.map((lang) => (
        <span key={lang} className={pillClass}>
          {lang}
        </span>
      ))}
      {overflow > 0 && <span className={`${pillClass} opacity-70`}>+{overflow}</span>}
    </motion.div>
  );
});

/* ── Language filter chip ─────────────────────────────────────── */
/* These ARE interactive (unlike the pills, which are labels), so the
   hover is allowed to be visible: a 1px lift, an accent-tinted fill
   and accent text — the same language as the Tag/pill hover from
   PR #11, one notch stronger because a click is a real action here.
   The old hover (text #475569 → #334155, border 10% → 25%) was so
   faint it read as no effect at all. The active chip already has
   shadow-accent-glow, so it stays distinct; it just deepens a touch. */
/* Memoized (P7) — with a stable onClick: the parent passes one
   useCallback'd handler plus the chip's own key (filterKey), never
   a fresh inline arrow, so the memo comparison can actually hit. */
const FilterChip = memo(function FilterChip({ label, active, filterKey, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(filterKey)}
      aria-pressed={active}
      className={`shrink-0 rounded-lg border px-4 py-3.5 text-xs font-medium transition-all duration-200 sm:text-sm ${
        active
          ? 'tone-accent border-accent/40 bg-accent/15 text-accent shadow-accent-glow hover:bg-accent/20'
          : 'border-glass/10 bg-glass/[0.04] text-muted hover:-translate-y-px hover:border-accent/40 hover:bg-accent/10 hover:text-accent'
      }`}
    >
      {label}
    </button>
  );
});

/* ── Show-more button ─────────────────────────────────────────── */
/* One shared button for both pager spots (Tier 4, S3 — the markup
   was written twice: once under Featured, once below the grid).
   Same label, same classes, same handler in both places. */
/* Memoized (P7) — the parent passes the stable handleShowMore
   callback, never a fresh inline arrow. */
const ShowMoreButton = memo(function ShowMoreButton({ remaining, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex items-center gap-2 rounded-xl border border-glass/10 bg-glass/[0.04] px-6 py-3 text-sm font-medium text-muted transition-all duration-300 hover:border-accent/25 hover:text-accent"
    >
      Show {remaining} more {remaining === 1 ? 'project' : 'projects'}
      <ChevronDown
        className="h-4 w-4 transition-transform group-hover:translate-y-0.5"
        aria-hidden
      />
    </button>
  );
});

/* ── Sort toggle ──────────────────────────────────────────────── */
/* One pill, THREE states, cycled on each click (Tamim, 2026-11-09):
   'off' — label "Featured", UNCOLOURED: the curated Featured view
   (Featured on top, More collapsed). The label names what is shown
   — clicking it APPLIES newest-first. No direction arrow: no sort
   is applied. 'newest' — label "Newest ↓", COLOURED: flat list,
   newest-first, no Featured. 'oldest' — label "Oldest ↑", COLOURED:
   flat list, oldest-first, no Featured. A third click returns to
   'off'. The colour is the "a sort is applied" signal, in the same
   active tone as the language chips (accent border + accent-tinted
   bg + accent text + shadow-accent-glow) — the label always matches
   what is shown, so the pill can never mislead again. Same glass
   language as the year dropdown trigger, so the two controls read
   as one cluster.
   The off state ALSO carries a sort icon (⇅, Tier 4, item 20):
   with no icon the bare "Featured" pill read like a static label
   next to the Year control's chevron, not a button. The icon is a
   sort icon, not a chevron, because this is a cycle button — a
   chevron would wrongly imply a menu opens. The applied states
   keep their direction arrows (↓/↑), which say which way the list
   is sorted; the ⇅ appears only where no icon existed. Same size
   (h-3.5) as the Year chevron and the direction arrows. */
const SORT_CYCLE = { off: 'newest', newest: 'oldest', oldest: 'off' };

/* Memoized (P7) — the parent passes the stable handleSortToggle
   callback, never a fresh inline arrow. */
const SortToggle = memo(function SortToggle({ sortMode, onToggle }) {
  const isOldest = sortMode === 'oldest';
  const isOff = sortMode === 'off';
  const active = sortMode !== 'off';
  const ariaLabel =
    sortMode === 'off'
      ? 'Sort: off, showing the featured projects. Activate to sort newest first.'
      : sortMode === 'newest'
        ? 'Sort: newest first. Activate to sort oldest first.'
        : 'Sort: oldest first. Activate to clear the sort and show the featured projects.';
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-3.5 text-xs font-medium backdrop-blur-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 sm:text-sm ${
        active
          ? 'tone-accent border-accent/40 bg-accent/15 text-accent shadow-accent-glow hover:bg-accent/20'
          : 'border-glass/15 bg-glass/[0.06] text-muted hover:border-accent/40 hover:bg-accent/10 hover:text-accent'
      }`}
    >
      {isOff ? 'Featured' : isOldest ? 'Oldest' : 'Newest'}
      {isOff ? (
        <ArrowUpDown className="h-3.5 w-3.5" aria-hidden />
      ) : isOldest ? (
        <ArrowUp className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <ArrowDown className="h-3.5 w-3.5" aria-hidden />
      )}
    </button>
  );
});

/* ── Format repo name ─────────────────────────────────────────── */

/* "Oct 2026" style date for the card's Updated label. */
function formatUpdated(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/* Whole-word replacements after title-casing: acronyms and brand
   spellings that plain title-casing mangles ("Ai" -> "AI").
   Keys are the title-cased words; values are the proven spellings
   (repo descriptions, READMEs, curated titles). A replacement may
   be more than one word ("AIUB Live"). Only words in this map
   change — everything else keeps the plain title-case rule. */
const NAME_WORD_FIXES = {
  Ai: 'AI',
  Aiub: 'AIUB',
  Aiublive: 'AIUB Live',
  Php: 'PHP',
  Github: 'GitHub',
  Eda: 'EDA',
  ItFirmHub: 'ITFirmHub',
  DataBaseLabTask: 'Database Lab Task',
};

function formatName(name) {
  return name
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .split(' ')
    .map((w) => NAME_WORD_FIXES[w] ?? w)
    .join(' ');
}

/* ── Date helpers (sort + year filter) ────────────────────────── */
/* The year a repo was last updated in, in the visitor's local time
   — the same clock the "Updated <Mon YYYY>" card label uses, so a
   repo never lands in a different year than its card shows. */
function yearOf(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.getFullYear();
}

/* Epoch ms for sorting; null for a missing/invalid date — invalid
   dates always sort LAST, in either direction. */
function timeOf(iso) {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

/* Order a repo list by pushedAt. 'newest' is the order the data
   already arrives in (pushedAt desc); 'oldest' reverses it. The
   Featured block never goes through this — pins keep pin order. */
function sortRepos(list, dir) {
  const sorted = [...list];
  sorted.sort((a, b) => {
    const ta = timeOf(a.pushedAt);
    const tb = timeOf(b.pushedAt);
    if (ta === null && tb === null) return 0;
    if (ta === null) return 1;
    if (tb === null) return -1;
    return dir === 'oldest' ? ta - tb : tb - ta;
  });
  return sorted;
}

/* ── Project card item animation ──────────────────────────────── */
/* Tier 3 — the mount rise is capped at 8px (was 24px): below the
   smallest 10px gap on the page, so a card can never paint over
   the text below it even if two adjacent cards desync under a
   fast fling. Same 0.4s duration and 0.05s stagger, so the
   entrance still cascades — only the distance shrank. The exit
   rise is capped the same way (was -12px). */
const cardAnim = {
  hidden: { opacity: 0, y: 8, scale: 0.97 },
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
  exit: { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.25 } },
};

/* ── Repo stats row + action buttons ──────────────────────────── */
/* Written once, used by both card types (Featured + grid) — the
   markup was verbatim identical in both. Memoized like their
   parents (P7): a card re-render with the same stats/actions
   (e.g. a reorder that only moves the index) must not re-render
   these. Props are primitives, so the memo comparison can hit. */
const RepoStats = memo(function RepoStats({ updated, stars, forks }) {
  return (
    <div className="mt-4 flex items-center gap-4 text-xs text-muted-dim">
      {updated && <span>Updated {updated}</span>}
      {stars > 0 && (
        <span className="inline-flex items-center gap-1">
          <Star className="h-3.5 w-3.5" aria-hidden />
          {stars}
        </span>
      )}
      {forks > 0 && (
        <span className="inline-flex items-center gap-1">
          <GitFork className="h-3.5 w-3.5" aria-hidden />
          {forks}
        </span>
      )}
    </div>
  );
});

const RepoActions = memo(function RepoActions({ homepage, url }) {
  return (
    <div className="mt-auto flex flex-wrap gap-3 pt-6">
      {homepage && (
        <Button
          {...externalLinkProps(homepage)}
          variant="primary"
          className="hero-cta-fill hero-cta-fill--solid flex-1 sm:flex-none"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          Live demo
        </Button>
      )}
      {/* W1: no `url` → no button. Without this, externalLinkProps
          renders an <a> with no href: unfocusable, dead element. */}
      {url && (
        <Button
          {...externalLinkProps(url)}
          variant="secondary"
          className="hero-cta-fill hero-cta-fill--ghost"
        >
          <Github className="h-3.5 w-3.5" aria-hidden />
          GitHub
        </Button>
      )}
    </div>
  );
});

/* ── Featured project card ────────────────────────────────────── */
/* Richer than the grid card: the case-study details resolved by the
   fallback chain (portfolio.json → README → curated → GitHub). Every
   block renders only when its data exists — nothing is invented.
   The intro label is honest about the source: README text is an
   "Overview", a real problem statement is a "Problem", and the plain
   GitHub description (github fallback) — or a curated `description`
   standing in as the intro (curated-description) — is shown
   unlabeled, exactly like the grid card's description. */
/* Memoized (P7): a parent re-render passes the same repo object
   (the memoized featured list) and index, so the rich card — and
   the slideshow inside it — must not re-render for a scroll-spy
   or theme change. */
const FeaturedProjectCard = memo(function FeaturedProjectCard({ repo, index }) {
  const details = repo.details || {};
  const reduceMotion = useReducedMotion() ?? false;
  /* Fine pointer only (S4): the hover lift below must not fire on a
     touch tap — the emulated mouse never leaves, so a tap would
     leave the card lifted until the next tap elsewhere. Same gate
     Card.jsx uses for its tilt, via the shared useMediaQuery hook
     (PhotoLightbox freezes the same query at open). */
  const finePointer = useMediaQuery('(pointer: fine)');
  const updated = formatUpdated(repo.pushedAt);
  const introLabel =
    details.detailsSource === 'readme'
      ? 'Overview'
      : details.detailsSource === 'github' || details.detailsSource === 'curated-description'
        ? null
        : 'Problem';
  /* W1: guard once per card — a repo missing `topics` used to throw
     during render and unmount the whole section (no error boundary). */
  const topics = Array.isArray(repo.topics) ? repo.topics : [];
  /* Tech pills: curated/portfolio.json tech first (more specific,
     e.g. "Windows Forms"), else the repo's GitHub languages. */
  const tech =
    Array.isArray(details.tech) && details.tech.length > 0
      ? details.tech
      : Array.isArray(repo.languages) && repo.languages.length > 0
        ? repo.languages
        : repo.language
          ? [repo.language]
          : [];

  return (
    <motion.div
      custom={index}
      variants={cardAnim}
      initial={reduceMotion ? false : 'hidden'}
      whileInView="show"
      viewport={{ once: true, margin: '-40px' }}
    >
      <Card
        spotlight
        className="featured-card flex h-full flex-col overflow-hidden p-6 sm:p-7"
        whileHover={reduceMotion || !finePointer ? undefined : { y: -6, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {Array.isArray(repo.images) && repo.images.length > 0 && (
          <ProjectSlideshow images={repo.images} repoName={repo.name} />
        )}

        {/* Title + tech pills — W25: the shared LanguagePills
            with the resolved `tech` array, not a second copy of
            the slice + overflow rule. */}
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <h3 className="text-lg font-semibold text-heading sm:text-xl">{formatName(repo.name)}</h3>
          <LanguagePills langs={tech} />
        </div>

        {/* Problem / Overview / description */}
        {details.problem && (
          <div className="mt-4">
            {introLabel && (
              <p className="text-xs font-medium uppercase tracking-wider text-muted-dim">
                {introLabel}
              </p>
            )}
            <p className="mt-1 text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
              {details.problem}
            </p>
          </div>
        )}

        {/* Solution */}
        {details.solution && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-dim">Solution</p>
            <p className="mt-1 text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
              {details.solution}
            </p>
          </div>
        )}

        {/* Key features */}
        {Array.isArray(details.features) && details.features.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-dim">
              Key features
            </p>
            <ul className="mt-2 space-y-1.5">
              {details.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm leading-relaxed text-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Contribution */}
        {details.contribution && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-dim">
              My contribution
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
              {details.contribution}
            </p>
          </div>
        )}

        {/* Topics as tags */}
        {topics.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {topics.slice(0, 6).map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        )}

        {/* Stats row + actions (shared — see RepoStats / RepoActions above). */}
        <RepoStats updated={updated} stars={repo.stars} forks={repo.forks} />
        <RepoActions homepage={repo.homepage} url={repo.url} />
      </Card>
    </motion.div>
  );
});

/* ── Grid project card ────────────────────────────────────────── */
/* Extracted from the visible.map inline JSX (P7) so it can be
   memoized: the parent re-renders on every scroll-spy change, and
   each card carries a slideshow — re-rendering all of them on
   every scroll tick was the whole-tree cost. Props are
   referentially stable (the repo object from the memoized
   filtered list, the memoized langMap), so a parent re-render
   skips every card whose repo did not move; a filter change
   re-renders only the cards that enter, leave or move (index is
   a prop, so a reorder still re-renders the moved card — the
   stagger delay depends on it). Internal state (the slideshow's
   index, observers) is untouched by memo. The key lives on the
   component in the map below, not here. */
const GridProjectCard = memo(function GridProjectCard({ repo, langMap, index }) {
  const reduceMotion = useReducedMotion() ?? false;
  /* Fine pointer only (S4) — same gate as FeaturedProjectCard above:
     a touch tap must not leave the card lifted. */
  const finePointer = useMediaQuery('(pointer: fine)');
  const updated = formatUpdated(repo.pushedAt);
  /* W1: guard once per card — see FeaturedProjectCard above. */
  const topics = Array.isArray(repo.topics) ? repo.topics : [];
  return (
    <motion.div
      custom={index}
      variants={cardAnim}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
      exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : 'exit'}
      layout
    >
      <Card
        spotlight
        className="flex h-full flex-col overflow-hidden p-6 sm:p-7"
        whileHover={reduceMotion || !finePointer ? undefined : { y: -6, scale: 1 }}
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
          <h3 className="text-lg font-semibold text-heading sm:text-xl">{formatName(repo.name)}</h3>
          <LanguagePills repoName={repo.name} fallbackLanguage={repo.language} langMap={langMap} />
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
        {topics.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {topics.slice(0, 6).map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        )}

        {/* Stats row + actions (shared — see RepoStats / RepoActions above). */}
        <RepoStats updated={updated} stars={repo.stars} forks={repo.forks} />
        <RepoActions homepage={repo.homepage} url={repo.url} />
      </Card>
    </motion.div>
  );
});

/* ── Main component ───────────────────────────────────────────── */
/* Repos + loading/error come from App (single useGitHubRepos call,
   shared with the Skills section so the counts and the grid read
   the same data), as does the filter: a normalized skill/language
   key, or null for "All". */
function ProjectsSectionInner({ repos, featured, loading, error, activeFilter, onFilterChange }) {
  const reduceMotion = useReducedMotion() ?? false;
  /* Persisted "Show more" expansion (Tamim, 2026-11-09): the number
     of More projects shown survives a reload, so a refresh no longer
     collapses the grid back to Featured-only — and the page keeps its
     height, so the scroll restore lands on the same section instead
     of Experience / What I Build. The count is read synchronously in
     the lazy initializer (before first paint), so the grid renders
     expanded from the start: no collapsed → expanded flash, and the
     scroll-restore hook's height gate sees the correct height.
     `restoredCountRef` carries the value to the reset effect below:
     that effect must NOT overwrite it on mount (its first runs fire
     while the repos data is still loading, when featured is empty).
     Only a positive finite number counts; anything else falls back
     to the default. The value is clamped to the list length when it
     is applied (the list may have shrunk since it was saved). */
  const restoredCountRef = useRef(0);
  const [visibleCount, setVisibleCount] = useState(() => {
    try {
      const raw = sessionStorage.getItem(SHOW_MORE_KEY);
      const n = raw === null ? NaN : Number(raw);
      if (Number.isFinite(n) && n > 0) {
        const count = Math.floor(n);
        restoredCountRef.current = count;
        return count;
      }
    } catch {
      /* Storage unavailable (private mode, full) — the default. */
    }
    return INITIAL_COUNT;
  });
  /* Sort + year filter are local to this section — only Projects
     consumes them (the shared language filter stays in App because
     the Skills section shares it). sortMode is a 3-state cycle
     (Tamim, 2026-11-09): 'off' (default — the curated Featured view,
     More grid in newest-first order) → 'newest' (flat list,
     newest-first) → 'oldest' (flat list, oldest-first) → 'off'.
     The sort counts as a filter only once applied (mode !== 'off'). */
  const [sortMode, setSortMode] = useState('off');
  const [activeYear, setActiveYear] = useState(null);
  /* sortDir is the 2-state direction sortRepos takes: 'off' and
     'newest' both sort newest-first (the order the data already
     arrives in). */
  const sortDir = sortMode === 'oldest' ? 'oldest' : 'newest';

  /* "Filtered" = a language filter, a year filter, OR an APPLIED
     sort is active. Any of the three turns Featured priority OFF
     (one flat list, sorted as chosen); only "All" + "All years" +
     sort 'off' shows the Featured-first view. The sort counts as a
     filter only once applied (Tamim, 2026-11-09): the default
     "Newest" label is the section's order, not an applied sort. */
  const isFiltered = activeFilter !== null || activeYear !== null || sortMode !== 'off';

  /* Years present in the data (pushedAt), derived live — never
     hardcoded. A repo pushed in a new year adds that year on the
     next sync; a year with no repos never appears. */
  const yearOptions = useMemo(() => {
    const counts = new Map();
    for (const r of repos) {
      const y = yearOf(r.pushedAt);
      if (y === null) continue;
      counts.set(y, (counts.get(y) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => b.year - a.year);
  }, [repos]);

  /* The visible-count reset + persistence effects live below the
     `filtered` list (not here): the reset effect reads
     `filtered.length` in its dependency array, and a dependency
     array is evaluated during render — `filtered` is declared
     below, so these effects must be declared after it. */

  /* Featured = the first 4 pinned repos (in pin order), resolved
     against the loaded repos. Everything else is "More Projects" —
     no repo ever appears twice on the page. When `featured` is
     empty (no token / GraphQL failed / old snapshot), the section
     renders exactly as before: the full grid, no headings. */
  const featuredRepos = useMemo(() => {
    if (!Array.isArray(featured) || featured.length === 0) return [];
    return featured
      .map((name) => repos.find((r) => r.name.toLowerCase() === name.toLowerCase()))
      .filter(Boolean);
  }, [featured, repos]);

  const featuredNames = useMemo(
    () => new Set(featuredRepos.map((r) => r.name.toLowerCase())),
    [featuredRepos]
  );

  const moreRepos = useMemo(
    () => repos.filter((r) => !featuredNames.has(r.name.toLowerCase())),
    [repos, featuredNames]
  );

  /* Languages ship with the repos data itself — the build-time
     snapshot `public/projects.json` and `/api/projects` both carry a
     `languages` array per repo — so no runtime GitHub call is ever
     needed. (The old useRepoLanguages hook fetched any repo that
     arrived without one, unauthenticated, straight from the
     browser; it is deleted. A repo without a languages array now
     falls back to its primary `language` inline — see LanguagePills
     and getRepoKeys — instead of a network fetch.)
     NOTE: an EMPTY array is also complete — some repos (e.g. BuyTrust)
     have no code language at all (primary: null, languages: []). */
  const langMap = useMemo(() => {
    const map = {};
    for (const r of repos) {
      if (Array.isArray(r.languages)) {
        map[r.name] = r.languages;
      }
    }
    return map;
  }, [repos]);

  /* Filter chips come from the union of ALL repos' languages —
     not just the visible slice — so a language that only exists in
     repos 7+ always has a chip (previously chips only covered the
     first 6). Featured repos are INCLUDED now: the flat filtered
     grid contains them, so a featured-only language (C++, C#) is a
     real filter — it shows that featured repo as a regular card —
     not a dead end. */
  const allLangs = useMemo(() => {
    const set = new Set();
    for (const langs of Object.values(langMap)) {
      langs.forEach((l) => set.add(l));
    }
    return Array.from(set).sort();
  }, [langMap]);

  /* Build filter chip list from the union of all loaded languages */
  const languages = useMemo(() => {
    if (allLangs.length === 0) return ['All'];
    return ['All', ...allLangs];
  }, [allLangs]);

  /* The active filter's skill display name, when it came from a
     skill pill (null for a plain language chip or "All"). */
  const activeSkillName = useMemo(
    () => (activeFilter ? findSkillByKey(activeFilter, portfolio.skills) : null),
    [activeFilter]
  );

  /* When the active filter is a framework/tool skill (React,
     Tailwind, MySQL) there is no language chip for it — show it as
     an active chip so the filter is always visible here. Clicking
     it clears the filter, like any active chip. */
  const activeSkillChip = useMemo(() => {
    if (!activeFilter || !activeSkillName) return null;
    const hasChip = languages.some((lang) => lang !== 'All' && normalizeKey(lang) === activeFilter);
    return hasChip ? null : activeSkillName;
  }, [activeFilter, activeSkillName, languages]);

  /* Filter the full repo list by the shared key AND the year: a
     repo matches when the language key appears in its languages OR
     topics (the same rule the Skills counts use, so a pill's count
     and the filtered grid always agree) and its pushedAt year is
     the selected one. With no filter (All + All years + sort off),
     the list is the More repos (Featured lives in its own block
     above). With a filter (language, year, OR an applied sort), the
     list is EVERY matching repo — featured + more together — rendered as
     regular grid cards, never the rich Featured cards. The sort
     orders the list in both states; the Featured block itself is
     never re-sorted (pin order). */
  const filtered = useMemo(() => {
    const list = !isFiltered
      ? moreRepos
      : repos.filter((r) => {
          if (activeFilter && !getRepoKeys(r, langMap[r.name]).has(activeFilter)) return false;
          if (activeYear !== null && yearOf(r.pushedAt) !== activeYear) return false;
          return true;
        });
    return sortRepos(list, sortDir);
  }, [repos, moreRepos, isFiltered, activeFilter, activeYear, langMap, sortDir]);

  /* The filter is shared with the Skills section — one filter
     state, owned by App. The initial visible count depends on the
     state: FILTERED starts at the first batch of 4; ALL starts
     collapsed (0 More) when there is a Featured block, and at the
     first batch of 4 when there is none (no pins / GraphQL failed —
     the old behaviour: the full grid, no headings). Reset whenever
     the filter, the year, or the sort changes, or when the Featured
     block appears on load.
     EXCEPTION — a persisted expansion (see the lazy initializer
     above): when one was restored on mount, apply it once the
     Featured block exists (the list it belongs to) instead of
     resetting to collapsed. While the repos data is still loading
     (featured empty) the restore just waits — resetting here would
     wipe it, which is exactly the refresh bug Tamim reported. Once
     applied the flag is cleared, so later filter / year / sort
     changes reset exactly as before. If the data settles with no
     Featured block at all, the restore has no list to belong to —
     fall through to the normal reset. These effects are declared
     here, below `filtered`, on purpose: the reset reads
     `filtered.length` in its dependency array, and a dependency
     array is evaluated during render, so declaring it above
     `filtered` crashes the render (temporal dead zone). */
  useEffect(() => {
    if (restoredCountRef.current > 0) {
      if (!isFiltered && featured.length > 0) {
        setVisibleCount(Math.min(restoredCountRef.current, filtered.length));
        restoredCountRef.current = 0;
        return;
      }
      if (featured.length === 0 && !loading) {
        restoredCountRef.current = 0;
        /* Fall through to the normal reset below. */
      } else {
        return; /* Data still loading — wait, don't reset. */
      }
    }
    setVisibleCount(isFiltered || featured.length === 0 ? INITIAL_COUNT : 0);
  }, [activeFilter, activeYear, sortMode, featured.length, isFiltered, filtered.length, loading]);

  /* Persist the ALL-state expansion (see above): every change to
     the count is written, so a reload restores it. Only the ALL
     state is written — a filtered list is a different list, and
     the persisted count belongs to the ALL state. Entering a
     filter DROPS the stored value, so a reload after filtering
     returns to the ALL state collapsed (the default), not to a
     stale expanded count. "Show less" sets the count back to the
     initial count, so the next write stores that — no stale
     expanded value is ever left behind. */
  useEffect(() => {
    if (isFiltered) {
      try {
        sessionStorage.removeItem(SHOW_MORE_KEY);
      } catch {
        /* Storage unavailable — nothing to drop. */
      }
      return;
    }
    try {
      sessionStorage.setItem(SHOW_MORE_KEY, String(visibleCount));
    } catch {
      /* Storage unavailable (private mode, full) — the next reload
         simply starts collapsed, as before. */
    }
  }, [visibleCount, isFiltered]);

  /* One list, one slice, for both states. `initialCount` is the
     count "Show less" returns to: 0 More (Featured only) in ALL
     with a Featured block, the first batch of 4 otherwise. */
  const initialCount = !isFiltered && featuredRepos.length > 0 ? 0 : INITIAL_COUNT;
  const visible = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visibleCount;
  const expanded = visibleCount > initialCount;

  /* "Showing X of Y" counts every card on screen. In ALL the Featured
     cards sit above this grid, so shown = Featured + the visible More
     slice and total = all repos. In FILTERED the flat list IS the
     whole view. Both derive live from the repos data — a new repo or
     a re-pin moves the numbers by itself, nothing hardcoded. */
  const shown = isFiltered ? visible.length : featuredRepos.length + visible.length;
  const total = isFiltered ? filtered.length : repos.length;

  /* Stable callbacks for the memoized controls (P7): a fresh
     inline arrow on every render would defeat their memo, so the
     chips, the sort toggle and the show-more button all receive
     one useCallback'd handler each. onFilterChange is App's
     setProjectFilter — stable by itself. */
  const handleFilterChip = useCallback((key) => onFilterChange(key), [onFilterChange]);
  const handleSortToggle = useCallback(() => setSortMode((m) => SORT_CYCLE[m]), []);

  /* +4 per click, never past the end. */
  const handleShowMore = useCallback(() => {
    setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length));
  }, [filtered.length]);

  /* "Show less" removes whole rows below, but the browser keeps the
     same absolute scroll position — which then points at Experience /
     Services / Contact instead of Projects. Scroll back to the
     Projects heading instead. The section top never moves during the
     collapse (cards are removed from below it), so the target computed
     here stays valid while the exit animation runs. */
  const handleShowLess = () => {
    const el = document.getElementById('projects');
    setVisibleCount(initialCount);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET_PX;
    /* Lenis when active, native smooth scroll otherwise (instant
       under reduced motion — the helper applies the same check). */
    smoothScrollTo(top);
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
            Projects couldn&apos;t be loaded right now. Please try again later.
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
          {/* Controls — FIRST, directly under the section heading,
              BEFORE the Featured block (Tamim, binding: the filters
              must sit before Featured, where the chips were before
              the Featured redesign — never below it).
              LAYOUT (Tamim, 2026-11-09): the Year + sort glass
              cluster shares the SUBTITLE row, right-aligned and
              vertically centred on the subtitle text — the old
              layout left that row's right half empty and the
              controls on their own row below it, pushing the chips
              and cards down by a full row. The subtitle is rendered
              by SectionWrapper (shared with every section, not
              touched here), so the cluster is pulled up over the
              header's bottom margin with a negative top margin —
              the margin is empty space, so nothing overlaps.
              Geometry, measured live at 1280px: subtitle 24px tall,
              header bottom margin 56px, controls 50px tall, so the
              pull-up that centres the controls on the subtitle is
              56 + 12 + 25 = 93px. Re-check that number if the
              subtitle copy ever changes length.
              RESPONSIVE: below lg the subtitle and the cluster
              cannot share a row — on a 390px phone the subtitle
              wraps to two lines and the cluster is 249px wide, and
              even at 768px only 22px would separate the subtitle
              text from the cluster. So below lg the cluster stacks
              UNDER the subtitle, right-aligned, 12px below it
              (-mt-7 under the 40px header margin on mobile,
              sm:-mt-11 under the 56px margin from sm up) — the
              same reclaimed gap, no squeeze, no overlap. From lg
              up (1024px: ~238px of clear air between subtitle text
              and cluster) it sits on the subtitle row.
              The language chips row sits below the cluster in both
              layouts and moves up with it — that is the space being
              reclaimed. */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
            className="-mt-7 mb-8 sm:-mt-11 lg:-mt-[93px]"
          >
            <div className="mb-4 flex justify-end">
              <div className="flex items-center gap-2">
                <YearDropdown years={yearOptions} value={activeYear} onChange={setActiveYear} />
                <SortToggle sortMode={sortMode} onToggle={handleSortToggle} />
              </div>
            </div>
            {/* Language chips — MOBILE (below sm): one horizontally
                scrollable row (Tier 4, item 19). The 12 chips wrapped
                into 3 rows on a 390px phone (~154px tall) and pushed
                Featured ~110px down the page. Now the strip is a
                single row with native horizontal scroll, a hidden
                scrollbar, and a right-edge fade so the cut-off last
                chip reads as "more to the right". Chips keep their
                size (shrink-0 on FilterChip), order, styles and
                44px+ targets; "All" stays first at the left.
                DESKTOP (sm+): unchanged — flex-wrap, no scroll,
                no mask, no extra padding (verified byte-identical
                layout in the after-check). The py-1 on mobile is
                breathing room for the focus ring / hover lift /
                glow, which overflow-x would otherwise clip.
                Keyboard: the chips are native buttons, so Tab moves
                through them and the browser scrolls the focused
                chip into view on its own. */}
            <div
              role="group"
              aria-label="Filter projects by language"
              className="flex flex-nowrap gap-2 overflow-x-auto py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,black_88%,transparent_100%)] sm:flex-wrap sm:overflow-visible sm:py-0 sm:[mask-image:none]"
            >
              {/* W4: show the row whenever there is anything to
                  show or clear — the old `languages.length > 2`
                  gate hid the whole row (including "All") when the
                  data had exactly one language, leaving an active
                  filter with no visible chip and no way to clear
                  it here. `languages` is ['All', ...allLangs], so
                  length > 1 means at least one real language. */}
              {(languages.length > 1 || activeFilter !== null) && (
                <>
                  {languages.map((lang) => {
                    const key = lang === 'All' ? null : normalizeKey(lang);
                    return (
                      <FilterChip
                        key={lang}
                        label={lang}
                        active={activeFilter === key}
                        filterKey={key}
                        onClick={handleFilterChip}
                      />
                    );
                  })}
                  {activeSkillChip && (
                    <FilterChip
                      label={activeSkillChip}
                      active
                      filterKey={null}
                      onClick={handleFilterChip}
                    />
                  )}
                </>
              )}
            </div>
          </motion.div>

          {/* ALL state: Featured — the first 4 pinned repos, in pin
              order, with their case-study details. Re-pinning on
              GitHub updates this block automatically. Hidden while a
              filter is active: the filtered state is one flat list.
              Never re-sorted — pins keep pin order. */}
          {!isFiltered && featuredRepos.length > 0 && (
            <>
              <h3 className="mb-6 text-lg font-semibold text-heading sm:text-xl">Featured</h3>
              <div className="grid gap-6 lg:grid-cols-2">
                {featuredRepos.map((repo, idx) => (
                  <FeaturedProjectCard key={repo.id} repo={repo} index={idx} />
                ))}
              </div>

              {/* Expand entry point — directly under Featured, but ONLY
                  while collapsed: no grid exists yet, so under
                  Featured is the only sensible place. Collapsed:
                  only "Show N more projects". Once expanded the
                  pager lives BELOW the grid (see the pagination
                  block after the grid): a control that reveals
                  content below must sit at the end of that content,
                  not at its start, or every next click costs a
                  scroll-up → click → scroll-down. */}
              {moreRepos.length > 0 && !expanded && (
                <div className="mt-10 text-center">
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {remaining > 0 && (
                      <ShowMoreButton remaining={remaining} onClick={handleShowMore} />
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* "More Projects" heading — only once the More grid is
              expanded (never while collapsed, never while filtered). */}
          {!isFiltered && featuredRepos.length > 0 && expanded && (
            <h3 className="mb-6 mt-14 text-lg font-semibold text-heading sm:text-xl">
              More Projects
            </h3>
          )}

          {/* The grid — one render for both states. ALL: the More
              repos (empty while collapsed — the grid stays mounted
              with no cards, so AnimatePresence plays the exit on
              collapse). FILTERED: every matching repo (featured +
              more) as a regular grid card. */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* mode="sync" on purpose: popLayout makes Framer Motion
                inject a <style> element per mounted card, which the
                Content-Security-Policy blocks (4 console errors on
                every load). Sync keeps the same enter/exit animation. */}
            <AnimatePresence mode="sync">
              {visible.map((repo, idx) => (
                <GridProjectCard key={repo.id} repo={repo} langMap={langMap} index={idx} />
              ))}
            </AnimatePresence>
          </div>

          {/* Empty filtered state — reachable when a language × year
              combination matches nothing (e.g. R + 2024: both R
              repos were pushed in 2026). A language alone or a year
              alone always matches >= 1 repo by construction, so this
              only ever appears for a combination. */}
          {isFiltered && filtered.length === 0 && (
            <div className="rounded-2xl border border-card bg-card p-8 text-center">
              <p className="text-sm text-muted">No projects match this filter.</p>
            </div>
          )}

          {/* Pagination below the grid — FILTERED state, the ALL
              state when there is no Featured block (first 4 +
              pager), AND the ALL state with Featured once expanded.
              Collapsed ALL-with-Featured keeps its entry point
              under Featured (no grid exists yet), but once the grid
              exists the pager belongs at its end: in ALL-expanded
              `filtered` is the More repos and `visible.length`
              equals `visibleCount`, so the "Showing X of Y" line
              below is already correct there. The `|| expanded`
              on the count gate keeps "Show less" reachable in the
              edge case of <= 4 More repos (otherwise expanding
              would strand the user with no way back). */}
          {(filtered.length > INITIAL_COUNT || expanded) &&
            (isFiltered || featuredRepos.length === 0 || expanded) && (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-8 text-center"
              >
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {remaining > 0 && (
                    <ShowMoreButton remaining={remaining} onClick={handleShowMore} />
                  )}
                  {expanded && (
                    <button
                      type="button"
                      onClick={handleShowLess}
                      className="group inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-muted transition-all duration-300 hover:text-accent"
                    >
                      Show less
                      <ChevronUp
                        className="h-4 w-4 transition-transform group-hover:-translate-y-0.5"
                        aria-hidden
                      />
                    </button>
                  )}
                </div>
                <p className="mt-3 text-xs text-muted-dim">
                  Showing {shown} of {total} projects
                </p>
              </motion.div>
            )}
        </>
      )}
    </SectionWrapper>
  );
}

/* Memoized (P7): App re-renders on every scroll-spy change and
   theme toggle, and this section's props — the repos + featured
   arrays (set once by useGitHubRepos, referentially stable after
   load), loading / error, the filter, and the stable setProjectFilter
   callback — do not change across those renders. So the whole
   section, its cards and their slideshows, must not re-render
   for a nav highlight change. Internal state (visibleCount, sort,
   year) still re-renders on its own setState calls, exactly as
   before — memo only skips parent-driven renders. */
export const ProjectsSection = memo(ProjectsSectionInner);
