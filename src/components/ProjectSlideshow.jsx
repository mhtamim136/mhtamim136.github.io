import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { PhotoLightbox } from './PhotoLightbox';

const AUTO_ADVANCE_MS = 3500;
const SWIPE_THRESHOLD = 50;
/* After the user changes a slide by hand, auto-advance stays paused
   for a while so it never yanks the slide away mid-look. */
const MANUAL_PAUSE_MS = 7000;

/* The slide transition is a plain opacity crossfade (see
   `slideVariants` below), not a directional x-slide — the x-slide
   is what caused the light-mode blink and the lean on arrow taps.
   With reduced motion the swap is instant (duration 0). */

/**
 * Professional project-image carousel (Airbnb / Behance style).
 *
 * - 16:9 cover image; slides CROSSFADE (opacity only, no x movement).
 *   The x-slide that was here before is gone on purpose: when a slide
 *   entered from x=+100% its <img> was still fetching (lazy + only the
 *   next slide preloaded, and the entering slide mounts off-viewport
 *   so the fetch starts late), so the entering slide was transparent
 *   and the near-white card background showed through as a bright
 *   band sweeping in — the light-mode blink Tamim filmed (dark mode
 *   hides the same band because its card background is dark). A
 *   crossfade can never do that: the outgoing image stays underneath
 *   covering the background until the incoming one is opaque. The
 *   same change removes the picture sweeping 356px sideways on an
 *   arrow tap: the image just fades. Swipe still works — the drag
 *   only decides the direction, it no longer IS the transition. The
 *   WHOLE BOX leaning (the card itself tilting and sticking after a
 *   tap) is a different cause — Card.jsx's pointer-tracking tilt
 *   reacting to the tap's emulated mouse — fixed there by gating
 *   the tilt to mouse/pen only.
 * - Auto-advances every 3.5s; pauses on hover, when the card scrolls
   off-screen, when the tab is hidden, and briefly after any manual
   change. `prefers-reduced-motion` disables auto-advance and sliding.
 * - Manual control: prev/next arrows (hover-reveal on desktop, always
 *   visible on touch), clickable dots, and swipe (drag).
 * - Tap / click the image (or Enter / Space on it) opens the photo
 *   lightbox in its rectangular variant, so a screenshot can be seen
 *   full-size — on a phone the slideshow is ~350px wide and there
 *   was no way to enlarge it at all (Tier 4). The tap is a plain
 *   React onClick, NOT framer's onTap: onTap is broken here by
 *   design of the library — motion-dom's press gesture refuses to
 *   fire while ANY drag is active, and when a tap moves 3px or more
 *   the parent drag starts, the press bails out at pointerup WITHOUT
 *   clearing its internal `isPressing` set, so that slide's onTap is
 *   dead for every later tap until the slide unmounts. A real thumb
 *   wobbles a few px on almost every tap, which is why the lightbox
 *   opened only sometimes. A native click has no such gate. A drag
 *   must never open the lightbox, so the click is ignored when the
 *   pointer moved at least the swipe distance (SWIPE_THRESHOLD, the
 *   same distance that changes the slide) between pointerdown and
 *   the click — a real thumb wobbles a few px on every tap and must
 *   still open, while a swipe never does. The movement is tracked
 *   with plain pointer events — synchronous, so it cannot lose the
 *   race the way a frame-delayed onDragEnd guard would).
 * - Every slide is preloaded once the card is on screen, so a swap
 *   never lands on an image that still has to be fetched (the old
 *   "preload only the next slide" left manual prev/dot jumps and the
 *   first auto-advance on a slow connection fetching mid-swap).
 *   Images lazy-load; the preload is gated on the card being in view
 *   so off-screen cards fetch nothing. The image area has a fixed
 *   16:9 ratio, so cards never change height.
 * - Rendered only when a repo actually has images — repos without a
 *   `Project_Card` folder keep the text-only card (see ProjectsSection).
 */
export function ProjectSlideshow({ images, repoName }) {
  const count = images.length;
  const [index, setIndex] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(
    typeof document === 'undefined' ? true : !document.hidden,
  );
  const [reducedMotion, setReducedMotion] = useState(false);
  /* Image URLs whose <img> failed to load (bad URL, offline host,
     blocked origin). A failed slide shows a themed placeholder
     instead of a black void + huge broken-image alt text; the badge,
     arrows and dots keep working, and a slide that loads is
     unaffected. Keyed by URL so each slide fails independently. */
  const [failed, setFailed] = useState({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const containerRef = useRef(null);
  const resumeTimer = useRef(null);
  /* Crossfade only — no x movement at all (see the header comment).
     The outgoing slide stays underneath, opaque, until the incoming
     one has faded in over it, so the card background can never show
     through mid-swap. With reduced motion the swap is instant. */
  const slideVariants = {
    enter: { opacity: 0 },
    center: { opacity: 1 },
    exit: { opacity: 0 },
  };
  /* A click that follows a drag must not open the lightbox. The flag
     is set by plain pointer events on the slide (synchronous — a
     frame-delayed onDragEnd guard would lose the race against the
     click). Reset on every pointerdown. */
  const downPointRef = useRef(null);
  const draggedRef = useRef(false);

  const paginate = useCallback(
    (dir) => {
      setIndex((prev) => (((prev + dir) % count) + count) % count);
    },
    [count],
  );
  const goTo = useCallback((i) => {
    setIndex(i);
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
    if (index >= count) setIndex(0);
  }, [index, count]);

  /* prefers-reduced-motion: no auto-advance, no sliding. */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  /* Pause when the card scrolls off-screen. Starts false so the
     preload below does not fetch for cards the user never scrolls
     to; the observer corrects it on the first frame. Without
     IntersectionObserver (very old browsers) assume in view, as
     before, so auto-advance still runs. */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
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
      reducedMotion ||
      lightboxOpen
    ) {
      return undefined;
    }
    const id = window.setInterval(next, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [count, hoverPaused, manualPaused, inView, tabVisible, reducedMotion, lightboxOpen, next]);

  /* Preload every slide once the card is on screen, so a swap never
     lands on an image that still has to be fetched — the old
     "next slide only" preload left manual prev/dot jumps (and the
     first auto-advance on a slow connection) fetching mid-swap.
     Gated on inView so off-screen cards fetch nothing. */
  useEffect(() => {
    if (count <= 1 || !inView) return undefined;
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    return undefined;
  }, [images, count, inView]);

  const showControls = count > 1;

  /* Open the lightbox for the current slide — never for a failed
     slide (there is no image to enlarge). */
  const openLightbox = useCallback(() => {
    if (!failed[images[index]]) setLightboxOpen(true);
  }, [failed, images, index]);

  return (
    <>
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
      /* Hover-pause is mouse-only: a touch tap fires an emulated
         mousemove that never leaves, so onMouseEnter would stick
         hoverPaused on and auto-advance would never resume until
         the user taps elsewhere (measured: counter stuck 2/8 for
         12s+ after a touch arrow tap). A real mouse still pauses
         on hover and resumes on leave. */
      onPointerEnter={(e) => {
        if (e.pointerType !== 'touch') setHoverPaused(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== 'touch') setHoverPaused(false);
      }}
    >
      {/* Slides — the wrapper fades; the img inside keeps the hover zoom. */}
      <AnimatePresence initial={false}>
        <motion.div
          key={images[index]}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            duration: reducedMotion ? 0 : 0.45,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="absolute inset-0 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-inset"
          role="button"
          tabIndex={0}
          aria-label={`View ${repoName} screenshot ${index + 1} of ${count} full screen`}
          onPointerDown={(e) => {
            downPointRef.current = { x: e.clientX, y: e.clientY };
            draggedRef.current = false;
          }}
          onPointerMove={(e) => {
            const p = downPointRef.current;
            if (
              p &&
              Math.hypot(e.clientX - p.x, e.clientY - p.y) >=
                SWIPE_THRESHOLD
            ) {
              draggedRef.current = true;
            }
          }}
          onPointerUp={() => {
            downPointRef.current = null;
          }}
          onClick={() => {
            /* A swipe just ended — its click must not open the
               lightbox. A real tap wobbles only a few px, so it
               opens. See the header comment for why this is a
               plain onClick and not framer's onTap. */
            if (draggedRef.current) {
              draggedRef.current = false;
              return;
            }
            openLightbox();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openLightbox();
            }
          }}
        >
          {/* A failed slide shows a themed placeholder (same 16:9
              box, no layout shift) instead of the broken image. */}
          {failed[images[index]] ? (
            <div
              role="img"
              aria-label={`${repoName} screenshot ${index + 1} of ${count} unavailable`}
              className="flex h-full w-full flex-col items-center justify-center gap-2 bg-glass/[0.04] px-4 text-center"
            >
              <ImageOff className="h-8 w-8 text-muted-dim" aria-hidden />
              <p className="text-sm font-medium text-muted">
                Screenshot unavailable
              </p>
              <p className="text-xs text-muted-dim">
                This image failed to load
              </p>
            </div>
          ) : (
            <img
              src={images[index]}
              alt={`${repoName} screenshot ${index + 1} of ${count}`}
              loading="lazy"
              decoding="async"
              draggable={false}
              onError={() =>
                setFailed((prev) =>
                  prev[images[index]]
                    ? prev
                    : { ...prev, [images[index]]: true },
                )
              }
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          )}
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
            className="absolute left-2.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => manualNav(next)}
            aria-label="Next image"
            className="absolute right-2.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
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

    {/* Full-size view — the existing photo lightbox in its rectangular
        variant (same zoom/close/Tab behaviour as the hero portrait),
        plus keyboard navigation: ArrowLeft / ArrowRight and the
        on-screen prev/next buttons move between screenshots while
        it stays open. Navigation routes through manualNav, so the
        7s manual pause applies after the lightbox closes, exactly
        like the slideshow's own arrows and dots. Mounted only while
        open, so no extra image request happens before the first tap. */}
    <AnimatePresence>
      {lightboxOpen && (
        <PhotoLightbox
          shape="rect"
          images={images}
          index={index}
          onNavigate={(i) => manualNav(() => setIndex(i))}
          src={images[index]}
          alt={`${repoName} screenshot ${index + 1} of ${count}`}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </AnimatePresence>
    </>
  );
}
