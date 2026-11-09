import { Suspense, lazy, useMemo, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { MotionConfig } from 'framer-motion';
import { portfolio } from './data/portfolio';
import { Navbar } from './components/Navbar';
import { ScrollToTop } from './components/ScrollToTop';
import { ScrollProgress } from './components/ScrollProgress';
import { BackgroundBlobs } from './components/BackgroundBlobs';
import { Spotlight } from './components/Spotlight';
import { Footer } from './components/Footer';
import { HeroSection } from './sections/HeroSection';
import { useActiveSection } from './hooks/useActiveSection';
import { useGitHubRepos } from './hooks/useGitHubRepos';
import { useLenis } from './hooks/useLenis';
import { useTheme } from './hooks/useTheme';

const AboutSection = lazy(() =>
  import('./sections/AboutSection').then((m) => ({ default: m.AboutSection }))
);
const SkillsSection = lazy(() =>
  import('./sections/SkillsSection').then((m) => ({ default: m.SkillsSection }))
);
const ProjectsSection = lazy(() =>
  import('./sections/ProjectsSection').then((m) => ({ default: m.ProjectsSection }))
);
const ExperienceSection = lazy(() =>
  import('./sections/ExperienceSection').then((m) => ({ default: m.ExperienceSection }))
);
const ServicesSection = lazy(() =>
  import('./sections/ServicesSection').then((m) => ({ default: m.ServicesSection }))
);
const ContactSection = lazy(() =>
  import('./sections/ContactSection').then((m) => ({ default: m.ContactSection }))
);

function SectionFallback() {
  return (
    <div className="flex min-h-[120px] items-center justify-center" aria-hidden>
      <div className="h-1 w-24 animate-pulse rounded-full bg-glass/10" />
    </div>
  );
}

function Divider() {
  return <div className="section-divider mx-auto max-w-5xl" aria-hidden />;
}

export default function App() {
  /* Lenis smooth scroll (off entirely under reduced motion). */
  useLenis();
  const sectionIds = useMemo(() => portfolio.nav.map((n) => n.id), []);
  const activeId = useActiveSection(sectionIds);
  const { isDark, toggle } = useTheme();
  /* One GitHub data call + one filter value, shared by the Skills
     and Projects sections — the pill counts and the grid read the
     same data, and the pills and the filter chips always agree. */
  const { repos, featured, loading, error } = useGitHubRepos();
  const [projectFilter, setProjectFilter] = useState(null);

  /* Skip link target: move keyboard focus into <main> so the next
     Tab starts in the content, not back at the nav. preventScroll:
     the native anchor jump already moved the viewport; focusing
     must not scroll it again. */
  const skipToContent = () => {
    document.getElementById('main')?.focus({ preventScroll: true });
  };

  return (
    <MotionConfig reducedMotion="user">
    <div className="relative min-h-screen">
      {/* Skip link (Tier 4, X-2) — the first Tab stop on the page.
          Visually hidden until keyboard focus (sr-only until
          :focus-visible), then a small themed pill at the top-left.
          Zero visual change otherwise; no animation, so reduced
          motion needs no handling. */}
      <a
        href="#main"
        onClick={skipToContent}
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-[70] focus-visible:rounded-lg focus-visible:bg-card focus-visible:px-4 focus-visible:py-2.5 focus-visible:text-sm focus-visible:font-medium focus-visible:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Skip to content
      </a>
      {/* Background layers */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-surface bg-grid-pattern bg-grid"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-radial-glow"
        aria-hidden
      />
      <BackgroundBlobs />

      {/* Cursor spotlight — soft light following the pointer (fine
          pointers only, disabled under reduced motion). */}
      <Spotlight />

      {/* Scroll progress bar */}
      <ScrollProgress />

      <Navbar
        items={portfolio.nav}
        activeId={activeId}
        isDark={isDark}
        onThemeToggle={toggle}
      />

      {/* tabIndex -1: the skip-link target. The ring is suppressed
          here on purpose — a ring around the whole page content
          would be noise; the skip link itself carries the ring. */}
      <main id="main" tabIndex={-1} className="pt-20 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:pt-[5.25rem]">
        <HeroSection />

        {/* One boundary for all six lazy sections — the fallback is
            identical for each, so separate wrappers only repeated
            the same spinner. */}
        <Suspense fallback={<SectionFallback />}>
          <Divider />
          <AboutSection />

          <Divider />
          <SkillsSection repos={repos} activeFilter={projectFilter} onFilterChange={setProjectFilter} />

          <Divider />
          <ProjectsSection repos={repos} featured={featured} loading={loading} error={error} activeFilter={projectFilter} onFilterChange={setProjectFilter} />

          <Divider />
          <ExperienceSection />

          <Divider />
          <ServicesSection />

          <Divider />
          <ContactSection />
        </Suspense>
      </main>

      <Footer />

      <ScrollToTop />

      {/* Vercel Analytics (visitors) + Speed Insights (Core Web Vitals) */}
      <Analytics />
      <SpeedInsights />
    </div>
    </MotionConfig>
  );
}
