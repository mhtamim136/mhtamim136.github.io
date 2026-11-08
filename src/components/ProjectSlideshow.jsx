import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AUTO_ADVANCE_MS = 3500;
const SWIPE_THRESHOLD = 50;
/* After the user changes a slide by hand, auto-advance stays paused
   for a while so it never yanks the slide away mid-look. */
const MANUAL_PAUSE_MS = 7000;

/* Directional slide variants — the slide moves the same way the user
   swiped (or the arrow points), so the motion matches the gesture.
   A crossfade ignores direction; a slide feels physical and is the
   standard for image carousels (Airbnb / Instagram / e-commerce).
   Defined inside the component so the resolvers can read the
   `reducedMotion` state: with reduced motion there is no slide at
   all (instant swap). */

/**
 * Professional project-image carousel (Airbnb / Behance style).
 *
 * - 16:9 cover image; slides move in the swipe/arrow direction.
 * - Auto-advances every 3.5s; pauses on hover, when the card scrolls
 *   off-screen, when the tab is hidden, and briefly after any manual
 *   change. `prefers-reduced-motion` disables auto-advance and sliding.
 * - Manual control: prev/next arrows (hover-reveal on desktop, always
 *   visible on touch), clickable dots, and swipe (drag).
 * - Only the next slide is preloaded; images lazy-load. The image
 *   area has a fixed 16:9 ratio, so cards never change height.
 * - Rendered only when a repo actually has images — repos without a
 *   `Project_Card` folder keep the text-only card (see ProjectsSection).
 */
export function ProjectSlideshow({ images, repoName }) {
  const count = images.length;
  /* [index, direction]: direction is +1 forward, -1 backward, and
     drives which side the next slide enters from. */
  const [[index, direction], setIndexState] = useState([0, 0]);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(
    typeof document === 'undefined' ? true : !document.hidden,
  );
  const [reducedMotion, setReducedMotion] = useState(false);
  const containerRef = useRef(null);
  const resumeTimer = useRef(null);
  const slideVariants = {
    enter: (dir) => ({
      x: reducedMotion ? 0 : dir >= 0 ? '100%' : '-100%',
    }),
    center: { x: 0 },
    exit: (dir) => ({
      x: reducedMotion ? 0 : dir >= 0 ? '-100%' : '100%',
    }),
  };

  const paginate = useCallback(
    (dir) => {
      setIndexState(([prev]) => [
        (((prev + dir) % count) + count) % count,
        dir,
      ]);
    },
    [count],
  );
  const goTo = useCallback((i) => {
    setIndexState(([prev]) => [
      i,
      i === prev ? 0 : i > prev ? 1 : -1,
    ]);
  }, []);
  const next = useCallback(() => paginate(1), [paginate]);
  const prev = useCallback(() => paginate(-1), [paginate]);

  /* Any manual change pauses auto-advance for a while. */
  const manualNav = useCallback((fn) => {
    fn();
    setManualPaused(true);
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(
      () => setManualPaused(false),
      MANUAL_PAUSE_MS,
    );
  }, []);

  useEffect(
    () => () => {
      if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    },
    [],
  );

  /* Keep the index valid if the image list changes. */
  useEffect(() => {
    if (index >= count) setIndexState([0, 0]);
  }, [index, count]);

  /* prefers-reduced-motion: no auto-advance, no sliding. */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  /* Pause when the card scrolls off-screen. */
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const obs = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.15,
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* Pause when the tab is hidden. */
  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  /* Auto-advance. */
  useEffect(() => {
    if (
      count <= 1 ||
      hoverPaused ||
      manualPaused ||
      !inView ||
      !tabVisible ||
      reducedMotion
    ) {
      return undefined;
    }
    const id = window.setInterval(next, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [count, hoverPaused, manualPaused, inView, tabVisible, reducedMotion, next]);

  /* Preload only the next slide. */
  useEffect(() => {
    if (count <= 1) return undefined;
    const img = new Image();
    img.src = images[(index + 1) % count];
    return undefined;
  }, [index, images, count]);

  const showControls = count > 1;

  return (
    <motion.div
      ref={containerRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={`${repoName} screenshots`}
      className="group relative -mx-6 -mt-6 mb-6 aspect-[16/9] overflow-hidden sm:-mx-7 sm:-mt-7"
      drag={reducedMotion ? false : 'x'}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.12}
      onDragEnd={(_, info) => {
        if (info.offset.x < -SWIPE_THRESHOLD) manualNav(next);
        else if (info.offset.x > SWIPE_THRESHOLD) manualNav(prev);
      }}
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
    >
      {/* Slides — the wrapper slides; the img inside keeps the hover zoom. */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={images[index]}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            duration: reducedMotion ? 0 : 0.45,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="absolute inset-0"
        >
          <img
            src={images[index]}
            alt={`${repoName} screenshot ${index + 1} of ${count}`}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </motion.div>
      </AnimatePresence>

      {/* Bottom gradient so the dots stay readable on bright photos. */}
      {showControls && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/55 to-transparent"
          aria-hidden
        />
      )}

      {/* Counter chip, top-right. */}
      {showControls && (
        <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2 py-0.5 text-[0.6875rem] font-medium tabular-nums text-white backdrop-blur-sm">
          {index + 1} / {count}
        </span>
      )}

      {/* Prev / next arrows — hover-reveal on desktop, always visible on touch. */}
      {showControls && (
        <>
          <button
            type="button"
            onClick={() => manualNav(prev)}
            aria-label="Previous image"
            className="absolute left-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => manualNav(next)}
            aria-label="Next image"
            className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </>
      )}

      {/* Dots — the active one stretches and takes the accent colour.
          The button is 24×24 (WCAG target size) while the visible dot
          stays 6px, so the look is unchanged but every dot is tappable. */}
      {showControls && (
        <div
          className="absolute inset-x-0 bottom-1 flex justify-center gap-0.5"
          aria-label="Choose image"
        >
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-current={i === index}
              aria-label={`Go to image ${i + 1}`}
              onClick={() => manualNav(() => goTo(i))}
              className="group flex h-6 w-6 items-center justify-center"
            >
              <span
                aria-hidden
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index
                    ? 'w-4 bg-accent'
                    : 'w-1.5 bg-white/60 group-hover:bg-white'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
