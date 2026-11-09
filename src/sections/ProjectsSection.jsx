import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Star, GitFork, ExternalLink, Github, ChevronDown, ChevronUp, Check, ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { SectionWrapper } from '../components/SectionWrapper';
import { Card } from '../components/Card';
import { ProjectSlideshow } from '../components/ProjectSlideshow';
import { YearDropdown } from '../components/YearDropdown';
import { Button } from '../components/Button';
import { Tag } from '../components/Tag';
import { portfolio } from '../data/portfolio';
import { normalizeKey, getRepoKeys, findSkillByKey } from '../utils/skillProjectCounts';
import { externalLinkProps } from '../utils/links';
import { smoothScrollTo } from '../utils/smoothScroll';
import { NAV_OFFSET_PX } from '../utils/navOffset';

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
function LanguagePills({ repoName, fallbackLanguage, langMap }) {
  const reduceMotion = useReducedMotion() ?? false;
  const langs = langMap[repoName];

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
      initial={reduceMotion ? false : { opacity: 0 }}
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
}

/* ── Show-more button ─────────────────────────────────────────── */
/* One shared button for both pager spots (Tier 4, S3 — the markup
   was written twice: once under Featured, once below the grid).
   Same label, same classes, same handler in both places. */
function ShowMoreButton({ remaining, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex items-center gap-2 rounded-xl border border-glass/10 bg-glass/[0.04] px-6 py-3 text-sm font-medium text-muted transition-all duration-300 hover:border-accent/25 hover:text-accent"
    >
      Show {remaining} more {remaining === 1 ? 'project' : 'projects'}
      <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" aria-hidden />
    </button>
  );
}

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

function SortToggle({ sortMode, onToggle }) {
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
}

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

/* ── Featured project card ────────────────────────────────────── */
/* Richer than the grid card: the case-study details resolved by the
   fallback chain (portfolio.json → README → curated → GitHub). Every
   block renders only when its data exists — nothing is invented.
   The intro label is honest about the source: README text is an
   "Overview", a real problem statement is a "Problem", and the plain
   GitHub description (github fallback) — or a curated `description`
   standing in as the intro (curated-description) — is shown
   unlabeled, exactly like the grid card's description. */
function FeaturedProjectCard({ repo, index }) {
  const details = repo.details || {};
  const reduceMotion = useReducedMotion() ?? false;
  const updated = formatUpdated(repo.pushedAt);
  const introLabel =
    details.detailsSource === 'readme'
      ? 'Overview'
      : details.detailsSource === 'github' ||
          details.detailsSource === 'curated-description'
        ? null
        : 'Problem';
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
        whileHover={{ y: -6, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {Array.isArray(repo.images) && repo.images.length > 0 && (
          <ProjectSlideshow images={repo.images} repoName={repo.name} />
        )}

        {/* Title + tech pills */}
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <h3 className="text-lg font-semibold text-heading sm:text-xl">
            {formatName(repo.name)}
          </h3>
          {tech.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tech.slice(0, MAX_PILLS).map((t) => (
                <span key={t} className={pillClass}>
                  {t}
                </span>
              ))}
              {tech.length > MAX_PILLS && (
                <span className={`${pillClass} opacity-70`}>
                  +{tech.length - MAX_PILLS}
                </span>
              )}
            </div>
          )}
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
            <p className="text-xs font-medium uppercase tracking-wider text-muted-dim">
              Solution
            </p>
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
        {repo.topics.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {repo.topics.slice(0, 6).map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-dim">
          {updated && (
            <span>Updated {updated}</span>
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
  );
}

/* ── Main component ───────────────────────────────────────────── */
/* Repos + loading/error come from App (single useGitHubRepos call,
   shared with the Skills section so the counts and the grid read
   the same data), as does the filter: a normalized skill/language
   key, or null for "All". */
export function ProjectsSection({ repos, featured, loading, error, activeFilter, onFilterChange }) {
  const reduceMotion = useReducedMotion() ?? false;
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
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
  const isFiltered =
    activeFilter !== null || activeYear !== null || sortMode !== 'off';

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

  /* The filter is shared with the Skills section — one filter
     state, owned by App. The initial visible count depends on the
     state: FILTERED starts at the first batch of 4; ALL starts
     collapsed (0 More) when there is a Featured block, and at the
     first batch of 4 when there is none (no pins / GraphQL failed —
     the old behaviour: the full grid, no headings). Reset whenever
     the filter, the year, or the sort changes, or when the Featured
     block appears on load. */
  useEffect(() => {
    setVisibleCount(isFiltered || featured.length === 0 ? INITIAL_COUNT : 0);
  }, [activeFilter, activeYear, sortMode, featured.length, isFiltered]);

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
    [featuredRepos],
  );

  const moreRepos = useMemo(
    () => repos.filter((r) => !featuredNames.has(r.name.toLowerCase())),
    [repos, featuredNames],
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
    [activeFilter],
  );

  /* When the active filter is a framework/tool skill (React,
     Tailwind, MySQL) there is no language chip for it — show it as
     an active chip so the filter is always visible here. Clicking
     it clears the filter, like any active chip. */
  const activeSkillChip = useMemo(() => {
    if (!activeFilter || !activeSkillName) return null;
    const hasChip = languages.some(
      (lang) => lang !== 'All' && normalizeKey(lang) === activeFilter,
    );
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

  /* +4 per click, never past the end. */
  const handleShowMore = () => {
    setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length));
  };

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
          {/* Controls — FIRST, directly under the section heading,
              BEFORE the Featured block (Tamim, binding: the filters
              must sit before Featured, where the chips were before
              the Featured redesign — never below it). Two rows:
              (1) the Year + sort glass cluster on its OWN row,
              right-aligned — it used to share the chips' row and
              sat too close under them, and a growing chips row
              could collide with it. Above the chips it has
              breathing room, and the chips can wrap freely below
              without ever touching the controls.
              (2) the language chips row below it. */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <div className="mb-4 flex justify-end">
              <div className="flex items-center gap-2">
                <YearDropdown years={yearOptions} value={activeYear} onChange={setActiveYear} />
                <SortToggle sortMode={sortMode} onToggle={() => setSortMode((m) => SORT_CYCLE[m])} />
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
              {(languages.length > 2 || activeSkillChip) && (
                <>
                  {languages.map((lang) => {
                    const key = lang === 'All' ? null : normalizeKey(lang);
                    return (
                      <FilterChip
                        key={lang}
                        label={lang}
                        active={activeFilter === key}
                        onClick={() => onFilterChange(key)}
                      />
                    );
                  })}
                  {activeSkillChip && (
                    <FilterChip
                      label={activeSkillChip}
                      active
                      onClick={() => onFilterChange(null)}
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
              <h3 className="mb-6 text-lg font-semibold text-heading sm:text-xl">
                Featured
              </h3>
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
              {visible.map((repo, idx) => {
                const updated = formatUpdated(repo.pushedAt);
                return (
                <motion.div
                  key={repo.id}
                  custom={idx}
                  variants={cardAnim}
                  initial={reduceMotion ? false : 'hidden'}
                  animate="show"
                  exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : 'exit'}
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
                      {updated && (
                        <span>Updated {updated}</span>
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
                );
              })}
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
          {(filtered.length > INITIAL_COUNT || expanded) && (isFiltered || featuredRepos.length === 0 || expanded) && (
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
                    <ChevronUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" aria-hidden />
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
