import { motion, useReducedMotion } from 'framer-motion';
import { ExternalLink, Trophy } from 'lucide-react';
import { portfolio } from '../data/portfolio';
import { SectionWrapper } from '../components/SectionWrapper';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { externalLinkProps } from '../utils/links';
import './HeroCtaFill.css';

/**
 * Research & Publications — conference papers, in Tamim's CV order
 * (Navigating first, Evaluating second, Predicting third — his
 * chosen order, not chronological). Title + authorship + venue +
 * date per paper, copied exactly from the final CV; nothing is
 * paraphrased and no abstract or impact line is invented. A status
 * pill appears only where one is set (the ICCA paper's
 * "Publication forthcoming" — the CV marks it forthcoming, so
 * there is no link to show yet); papers 1 & 3 carry no status
 * pill by Tamim's call, since their ResearchGate links are his
 * own uploads rather than official publisher links. An award chip
 * appears only where one is set (paper 3's Best Poster Award,
 * 2nd Place — it links to the official ICCTASS conference page,
 * not to the paper page). One link
 * button renders per entry in the paper's `links` array, in
 * order: paper 1 carries BOTH the AIUB official student-research
 * page (first) and ResearchGate, paper 3 AIUB + ResearchGate.
 */
export function ResearchSection() {
  const { research } = portfolio;
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <SectionWrapper
      id="research"
      title="Research & Publications"
      subtitle="Conference papers and publications."
    >
      <ol className="space-y-6">
        {research.map((paper, idx) => (
          <motion.li
            key={paper.title}
            initial={reduceMotion ? false : { opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: idx * 0.08, duration: 0.35 }}
          >
            <Card className="p-5 sm:p-6">
              <div className="flex gap-4 sm:gap-5">
                {/* Publication number — the list reads like a
                    bibliography, not another timeline. */}
                <span
                  aria-hidden
                  className="font-display text-xl font-semibold text-accent/50 sm:text-2xl"
                >
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                      {paper.role}
                    </span>
                    {paper.award && (
                      <a
                        {...externalLinkProps(paper.award.url)}
                        title="Best Poster Award — 2nd Place, Track 4 (Media and Mass Communication), ICCTASS 2025"
                        className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent transition-colors hover:bg-accent/15"
                      >
                        <Trophy className="h-3 w-3" aria-hidden />
                        {paper.award.label}
                      </a>
                    )}
                    {paper.status && (
                      <span className="rounded-full border border-glass/10 bg-glass/[0.04] px-2.5 py-0.5 text-xs font-medium text-muted">
                        {paper.status}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 text-base font-semibold leading-snug text-heading sm:text-lg">
                    {paper.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted">
                    {paper.venue} · {paper.date}
                  </p>
                  {paper.links.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {paper.links.map((paperLink) => (
                        <Button
                          key={paperLink.label}
                          {...externalLinkProps(paperLink.url)}
                          variant="secondary"
                          className="hero-cta-fill hero-cta-fill--ghost"
                        >
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                          {paperLink.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.li>
        ))}
      </ol>
    </SectionWrapper>
  );
}
