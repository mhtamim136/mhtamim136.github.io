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

  return (
    <MotionConfig reducedMotion="user">
    <div className="relative min-h-screen">
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

      <main className="pt-20 sm:pt-[5.25rem]">
        <HeroSection />

        <Divider />
        <Suspense fallback={<SectionFallback />}>
          <AboutSection />
        </Suspense>

        <Divider />
        <Suspense fallback={<SectionFallback />}>
          <SkillsSection repos={repos} activeFilter={projectFilter} onFilterChange={setProjectFilter} />
        </Suspense>

        <Divider />
        <Suspense fallback={<SectionFallback />}>
          <ProjectsSection repos={repos} featured={featured} loading={loading} error={error} activeFilter={projectFilter} onFilterChange={setProjectFilter} />
        </Suspense>

        <Divider />
        <Suspense fallback={<SectionFallback />}>
          <ExperienceSection />
        </Suspense>

        <Divider />
        <Suspense fallback={<SectionFallback />}>
          <ServicesSection />
        </Suspense>

        <Divider />
        <Suspense fallback={<SectionFallback />}>
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
