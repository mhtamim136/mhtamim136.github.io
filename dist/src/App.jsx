import { Suspense, lazy, useMemo } from 'react';
import { portfolio } from './data/portfolio';
import { Navbar } from './components/Navbar';
import { ScrollToTop } from './components/ScrollToTop';
import { HeroSection } from './sections/HeroSection';
import { useActiveSection } from './hooks/useActiveSection';

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
      <div className="h-1 w-24 animate-pulse rounded-full bg-white/10" />
    </div>
  );
}

export default function App() {
  const sectionIds = useMemo(() => portfolio.nav.map((n) => n.id), []);
  const activeId = useActiveSection(sectionIds);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-surface bg-grid-pattern bg-grid"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(34,211,238,0.12),transparent)]"
        aria-hidden
      />

      <Navbar items={portfolio.nav} activeId={activeId} />

      <main>
        <HeroSection />
        <Suspense fallback={<SectionFallback />}>
          <AboutSection />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <SkillsSection />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <ProjectsSection />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <ExperienceSection />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <ServicesSection />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <ContactSection />
        </Suspense>
      </main>

      <footer className="border-t border-white/[0.06] py-8 text-center text-xs text-muted-dim">
        <p>
          © {new Date().getFullYear()} {portfolio.name}. Built with React & Tailwind.
        </p>
      </footer>

      <ScrollToTop />
    </div>
  );
}
