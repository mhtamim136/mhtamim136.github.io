import { Suspense, lazy, useMemo } from 'react';
import { portfolio } from './data/portfolio';
import { Navbar } from './components/Navbar';
import { ScrollToTop } from './components/ScrollToTop';
import { ScrollProgress } from './components/ScrollProgress';
import { BackgroundBlobs } from './components/BackgroundBlobs';
import { HeroSection } from './sections/HeroSection';
import { useActiveSection } from './hooks/useActiveSection';
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
  const sectionIds = useMemo(() => portfolio.nav.map((n) => n.id), []);
  const activeId = useActiveSection(sectionIds);
  const { isDark, toggle } = useTheme();

  return (
    <div className="relative min-h-screen overflow-x-hidden">
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
          <SkillsSection />
        </Suspense>

        <Divider />
        <Suspense fallback={<SectionFallback />}>
          <ProjectsSection />
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

      <footer className="border-t border-glass/[0.06] py-8 text-center text-xs text-muted-dim">
        <p>
          © {new Date().getFullYear()} {portfolio.name}. All rights reserved.
        </p>
      </footer>

      <ScrollToTop />
    </div>
  );
}
