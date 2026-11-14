import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { animate, motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { PhotoLightbox } from './PhotoLightbox';
import { FitImage } from './FitImage';
import { useMediaQuery } from '../hooks/useMediaQuery';
import {
  SWIPE_THRESHOLD,
  DRAG_LATCH,
  COMMIT_FRACTION,
  SPRING_BACK,
  COMMIT_SLIDE,
} from '../utils/dragTrack';

const AUTO_ADVANCE_MS = 3500;
/* After the user changes a slide by hand, auto-advance stays paused
   for a while so it never yanks the slide away mid-look. */
const MANUAL_PAUSE_MS = 7000;

/**
 * Professional project-image carousel (Airbnb / Behance style).
 *
 * - 16:9 box; the whole image always shows (object-contain
 *   over a blurred copy of the same image filling the box —
 *   a tall or small screenshot is never cropped or over-zoomed,
 *   same fit as the lightbox); ONE carousel behaviour everywhere: a
 *   three-cell track (previous / current / next, each exactly the
 *   box width) that follows the finger 1:1 on a drag, commits past
 *   a third of the box width, and springs back below it — exactly like
 *   the photo lightbox. Arrows, dots and auto-advance use the SAME
 *   track animation (slide to ±width, then swap the index, reset
 *   the track to 0). There is no crossfade any more: the crossfade
 *   was the S1 blink fix, but it made the slideshow and the
 *   lightbox behave differently (the lightbox slides, the card
 *   faded), and Tamim asked for consistency.
 * - Why the blink cannot return with a track: the S1 blink was an
 *   entering slide mounting off-viewport with a lazy <img> that
 *   had never been fetched, showing the near-white card background
 *   as a band sweeping in. Here all three cells are mounted at
 *   once with eager <img>s once the card has been on screen
 *   (latched — see hasBeenInView), and the incoming slide is
 *   already on screen (as the adjacent cell) before the index
 *   swaps — and auto-advance does not start until the current and
 *   next slides have fired onLoad, so a swap never lands on an
 *   image that still has to be fetched. The outgoing image covers
 *   the background until the incoming one has taken its place:
 *   the same guarantee the crossfade gave, with the slide Tamim
 *   asked for.
 * - The WHOLE BOX leaning (the card itself tilting and sticking
 *   after a tap) is a different cause — Card.jsx's pointer-tracking
 *   tilt reacting to the tap's emulated mouse — fixed there by
 *   gating the tilt to mouse/pen only (S2). The drag here is plain
 *   pointer events, not framer's drag: framer's drag + press
 *   interplay once poisoned taps (S3 — onTap dead after a ≥3px
 *   wobble), so the tap that opens the lightbox is a plain React
 *   onClick, and a drag must never open it (the click is ignored
 *   when the pointer moved at least SWIPE_THRESHOLD between
 *   pointerdown and the click; a drag latches at DRAG_LATCH and
 *   also suppresses the release click).
 * - Auto-advances every 3.5s; pauses on hover, when the card scrolls
 *   off-screen, when the tab is hidden, and briefly after any manual
 *   change. `prefers-reduced-motion` disables auto-advance; swaps
 *   are instant (the drag still follows the finger — direct
 *   manipulation — but commit/spring-back have no animation).
 * - Manual control: prev/next arrows (hover-reveal on desktop, always
 *   visible on touch), clickable dots, and swipe (drag).
 * - Tap / click the image (or Enter / Space on it) opens the photo
 *   lightbox in its rectangular variant, so a screenshot can be seen
 *   full-size — on a phone the slideshow is ~350px wide and there
 *   was no way to enlarge it at all (Tier 4).
 * - Only the current slide ±1 neighbour ever loads: the three
 *   track cells mount eager <img>s, but only once the card has been
 *   on screen (latched — see hasBeenInView) — an off-screen card
 *   fetches nothing, and there is no preload-all any more (it used
 *   to fetch every slide the moment a card scrolled into view). A
 *   swap never lands on an image that still has to be fetched,
 *   because the entering slide is always the adjacent cell, already
 *   mounted, and auto-advance waits for its onLoad besides.
 *   The image area has a fixed 16:9 ratio, so cards never change
 *   height.
 * - Rendered only when a repo actually has images — repos without a
 *   `Project_Card` folder keep the text-only card (see ProjectsSection).
 */
function ProjectSlideshowInner({ images, repoName }) {
  const count = images.length;
  const [index, setIndex] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);
  const [inView, setInView] = useState(false);
  /* Latched twin of inView (M1 fix, 2026-11-10): once the card has
     been on screen, its images stay mounted for good. inView alone
     unmounts them every time the card scrolls out (they would reload
     with a pop-in on every scroll-back). inView stays live — it is
     still the auto-advance pause below. */
  const [hasBeenInView, setHasBeenInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(
    typeof document === 'undefined' ? true : !document.hidden
  );
  /* prefers-reduced-motion: no auto-advance, no sliding. */
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  /* Image URLs whose <img> failed to load (bad URL, offline host,
     blocked origin). A failed slide shows a themed placeholder
     instead of a black void + huge broken-image alt text; the badge,
     arrows and dots keep working, and a slide that loads is
     unaffected. Keyed by URL so each slide fails independently. */
  const [failed, setFailed] = useState({});
  /* Image URLs whose <img> has fired onLoad (same keying as
     `failed`). The auto-advance gate below waits for the current
     and next slides to be loaded before the first tick, so a
     slow-connection advance never sweeps in an empty box (S1).
     A failed slide counts as ready too — its placeholder is
     already renderable, and a failed load must not stall the
     carousel forever. */
  const [loaded, setLoaded] = useState({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const containerRef = useRef(null);
  const resumeTimer = useRef(null);
  /* A click that follows a drag must not open the lightbox. The flag
     is set by plain pointer events on the current cell (synchronous —
     a frame-delayed onDragEnd guard would lose the race against the
     click). Reset on every pointerdown; a drag latches it at
     DRAG_LATCH, a longer move at SWIPE_THRESHOLD. */
  const downPointRef = useRef(null);
  const draggedRef = useRef(false);
  /* Drag-follow tracking (same pattern as the lightbox's track):
     trackX is the track's horizontal offset as a Framer Motion
     value — written in the pointermove handler, so the photos
     follow the finger with no re-render per move. dragRef holds
     the box width for the gesture in progress; draggingRef latches
     once the gesture is a horizontal drag; animatingRef guards a
     commit/spring-back animation in flight (a new gesture is
     ignored until it settles); trackAnimRef holds the running
     animation controls. indexRef mirrors index so the slide
     functions (used by the auto-advance interval) never go stale.
     overrideCell lets a dot jump show the REQUESTED slide as the
     adjacent cell, so the track slides to exactly the slide the
     user tapped instead of peeking at the neighbour. */
  const trackX = useMotionValue(0);
  const dragRef = useRef(null);
  const draggingRef = useRef(false);
  const animatingRef = useRef(false);
  const trackAnimRef = useRef(null);
  const indexRef = useRef(index);
  const [overrideCell, setOverrideCell] = useState(null);
  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  const stopTrackAnim = () => {
    trackAnimRef.current?.stop();
    trackAnimRef.current = null;
  };

  /* Slides the track to the adjacent slide in direction dir (+1 =
     next, -1 = prev) and only then swaps the index, resetting the
     track to 0 in the same step. target is the index to land on.
     If target is not the adjacent slide in that direction (a dot
     jump to a far slide), the target is rendered as the adjacent
     cell first, so the track slides to exactly the slide the user
     asked for. Under reduced motion the swap is instant. Ignores
     the call while a slide is animating or a pointer is down (a
     drag in progress) — the auto-advance interval simply retries
     on its next tick. */
  const slideTo = useCallback(
    async (target, dir) => {
      if (count <= 1 || animatingRef.current) return;
      if (downPointRef.current || draggingRef.current) return;
      const from = indexRef.current;
      const norm = ((target % count) + count) % count;
      if (norm === from) return;
      const width = containerRef.current?.getBoundingClientRect().width ?? 0;
      if (width <= 0) {
        setIndex(norm);
        return;
      }
      const adj = dir > 0 ? (from + 1) % count : (from - 1 + count) % count;
      if (adj !== norm) {
        setOverrideCell({
          side: dir > 0 ? 'next' : 'prev',
          src: images[norm],
          index: norm,
        });
      }
      animatingRef.current = true;
      try {
        if (!reducedMotion) {
          trackAnimRef.current = animate(trackX, dir > 0 ? -width : width, COMMIT_SLIDE);
          await trackAnimRef.current;
        }
        setIndex(norm);
        setOverrideCell(null);
        stopTrackAnim();
        trackX.set(0);
      } catch {
        /* Stopped mid-flight — leave the index alone, clear the
           override and put the track back. */
        setOverrideCell(null);
        trackX.set(0);
      } finally {
        animatingRef.current = false;
      }
    },
    [count, images, reducedMotion, trackX]
  );
  const slideNext = useCallback(() => slideTo((indexRef.current + 1) % count, 1), [slideTo, count]);
  const slidePrev = useCallback(
    () => slideTo((indexRef.current - 1 + count) % count, -1),
    [slideTo, count]
  );

  /* Any manual change pauses auto-advance for a while. */
  const manualNav = useCallback((fn) => {
    fn();
    setManualPaused(true);
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => setManualPaused(false), MANUAL_PAUSE_MS);
  }, []);

  useEffect(
    () => () => {
      if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    },
    []
  );

  /* Keep the index valid if the image list changes. */
  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [index, count]);

  /* Pause when the card scrolls off-screen. Starts false so the
     cells below render no <img> for cards the user never scrolls
     to (lazy-load); the observer corrects it on the first frame. Without
     IntersectionObserver (very old browsers) assume in view, as
     before, so auto-advance still runs. The mount gate is the
     LATCHED hasBeenInView below — inView going false again must
     never unmount the images (see M1).
     Threshold 0.5 (D3 policy, 2026-11-14): auto-advance runs only
     while at least half the slideshow box is actually visible —
     the cards the user can see. At 0.15 a card 15% peeking in from
     the fold counted as "in view", so all four featured cards
     advanced in parallel and burned data (16 images in a 30s idle
     watch). Now: on desktop the two visible cards advance, on
     mobile the one visible card — a card below the fold stays
     paused until the user scrolls it into view. */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      setHasBeenInView(true);
      return undefined;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setHasBeenInView(true);
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* Pause when the tab is hidden. */
  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  /* No preload-all any more (2026-11-10): the old effect fetched
     EVERY slide the moment a card scrolled into view — BuyTrust
     15 images / 18.9 MB, online-quiz 17 / 1.8 MB — images the
     visitor may never look at. Only the current slide ±1 neighbour
     ever loads, via the eager track cells below: the entering slide
     is always the adjacent cell, already mounted, so the no-blink
     guarantee survives without preloading the rest. A dot jump to
     a far slide mounts its image as the adjacent cell first, so it
     starts fetching before the slide settles — on a slow
     connection it may pop in just after the 220ms slide, the
     same behaviour as any standard carousel. */

  const showControls = count > 1;

  /* Open the lightbox for the current slide — never for a failed
     slide (there is no image to enlarge). */
  const openLightbox = useCallback(() => {
    if (!failed[images[index]]) setLightboxOpen(true);
  }, [failed, images, index]);

  /* The three cells of the track. prev/next wrap around, so both
     neighbours always exist; a dot jump overrides the cell in the
     jump direction with the requested slide. */
  const prevIndex = (index - 1 + count) % count;
  const nextIndex = (index + 1) % count;
  const prevOverride = overrideCell?.side === 'prev' ? overrideCell : null;
  const nextOverride = overrideCell?.side === 'next' ? overrideCell : null;
  const prevSrc = prevOverride ? prevOverride.src : images[prevIndex];
  const nextSrc = nextOverride ? nextOverride.src : images[nextIndex];
  const prevShown = prevOverride ? prevOverride.index : prevIndex;
  const nextShown = nextOverride ? nextOverride.index : nextIndex;

  /* Auto-advance (slides, same track animation as a manual change).
     The interval does NOT start until the current slide AND the
     next slide have both loaded (or failed — a failed slide shows
     its placeholder, which is already renderable). Before this
     gate, the first tick 3.5s after inView could land before a
     multi-MB screenshot had loaded, sweeping in an empty box
     (S1). The gate holds for every tick, not just the first: after
     an advance the new next cell has only just mounted, so the
     interval re-arms only once it loads — auto-advance effectively
     waits 3.5s after the upcoming slide is ready. Manual arrows /
     dots / drag are never gated (a user-initiated swap may pop in
     just after the 220ms slide on a slow connection, as before).
     Lives here, after the prev/next computation, because the gate
     reads nextSrc. */
  useEffect(() => {
    const currentSrc = images[index];
    const currentReady = loaded[currentSrc] || failed[currentSrc];
    const nextReady = loaded[nextSrc] || failed[nextSrc];
    if (
      count <= 1 ||
      hoverPaused ||
      manualPaused ||
      !inView ||
      !tabVisible ||
      reducedMotion ||
      lightboxOpen ||
      !currentReady ||
      !nextReady
    ) {
      return undefined;
    }
    const id = window.setInterval(slideNext, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [
    count,
    hoverPaused,
    manualPaused,
    inView,
    tabVisible,
    reducedMotion,
    lightboxOpen,
    slideNext,
    images,
    index,
    nextSrc,
    loaded,
    failed,
  ]);

  /* One cell's content: a failed slide shows a themed placeholder
     (same 16:9 box, no layout shift); otherwise the image, eager
     (the track cells are the visible/adjacent slides — the only
     three that ever load). The current cell keeps the real alt
     text; adjacent cells are presentational. Nothing renders
     before the card has been in view once (see the hasBeenInView
     gate below). */
  const cellContent = (src, shownIndex, isCurrent) => {
    /* Lazy-load (2026-11-10): the three track cells render their
       <img>s only once the card has been in view (the LATCHED
       hasBeenInView gate above — not the live inView, which goes
       false again off-screen and must never unmount the images,
       see M1). Before that the 16:9 box stays empty — fixed ratio,
       so no layout shift — and no image is fetched. Previously the
       cells mounted eager <img>s at once, so every Featured card
       fetched 3 images on page load whether or not the user ever
       scrolled to Projects (measured: 12 images / 2,683 KiB for
       Featured alone, plus 12 more / 2,925 KiB from the More grid's
       mount-then-collapse transient — 24 images / 5,608 KiB on
       initial load). */
    if (!hasBeenInView) return null;
    if (failed[src]) {
      return (
        <div
          role="img"
          aria-label={`${repoName} screenshot ${shownIndex + 1} of ${count} unavailable`}
          className="flex h-full w-full flex-col items-center justify-center gap-2 bg-glass/[0.04] px-4 text-center"
        >
          <ImageOff className="h-8 w-8 text-muted-dim" aria-hidden />
          <p className="text-sm font-medium text-muted">Screenshot unavailable</p>
          <p className="text-xs text-muted-dim">This image failed to load</p>
        </div>
      );
    }
    /* Fit (2026-11-09): the WHOLE image is always visible —
       object-contain over a blurred, enlarged copy of the SAME
       image filling the box (same URL, so no extra fetch — the
       browser cache serves the backdrop). A tall or small
       screenshot used to be over-zoomed and heavily cropped by
       object-cover in this fixed 16:9 box; now it shows fully
       and the backdrop fills the bands — the premium gallery
       look, same as the lightbox. The backdrop is presentational
       (aria-hidden, pointer-events-none) and never intercepts
       pointer events: the drag handlers live on the cell div. */
    return (
      <FitImage
        src={src}
        alt={isCurrent ? `${repoName} screenshot ${shownIndex + 1} of ${count}` : ''}
        imgClassName="transition-transform duration-500 ease-out group-hover:scale-105"
        onError={() => setFailed((prev) => (prev[src] ? prev : { ...prev, [src]: true }))}
        onLoad={() => setLoaded((prev) => (prev[src] ? prev : { ...prev, [src]: true }))}
      />
    );
  };

  /* Plain pointer events on the current cell (same pattern as the
     lightbox's track): pointerdown records the start (first pointer
     only) and captures the pointer so move/up keep firing if the
     finger slides off the cell; a horizontal-dominant move of
     ≥ DRAG_LATCH latches a drag and the track follows the finger
     1:1, clamped to one box width; on release a drag past a third of the
     box width commits (slide, then swap the index) and anything
     less springs back. A drag latches draggedRef, so the release
     click never opens the lightbox; a plain tap still does. */
  const onSlidePointerDown = (e) => {
    if (downPointRef.current) return; /* First pointer only. */
    downPointRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
    draggedRef.current = false;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* Capture is best-effort — move/up still fire while over the cell. */
    }
    /* Drag-follow setup: measure the box once — the commit threshold
       is a third of this width. The drag latches in the move handler. */
    if (count > 1) {
      const width = containerRef.current?.getBoundingClientRect().width ?? 0;
      dragRef.current = width > 0 ? { width } : null;
      draggingRef.current = false;
    }
  };
  const onSlidePointerMove = (e) => {
    const p = downPointRef.current;
    if (!p || e.pointerId !== p.pointerId) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (!draggedRef.current && Math.hypot(dx, dy) >= SWIPE_THRESHOLD) {
      draggedRef.current = true;
    }
    /* Drag-follow: once the gesture is horizontal-dominant, the
       track follows the finger 1:1, clamped to one box width
       either way. Latching also marks the gesture a drag
       (draggedRef), so the release click is suppressed even for a
       short drag that springs back — otherwise the spring-back
       would be followed by the lightbox opening. A drag in flight
       while a slide animation runs is ignored. */
    if (dragRef.current && !animatingRef.current) {
      if (!draggingRef.current && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) >= DRAG_LATCH) {
        draggingRef.current = true;
        draggedRef.current = true;
      }
      if (draggingRef.current) {
        const width = dragRef.current.width;
        trackX.set(Math.max(-width, Math.min(width, dx)));
      }
    }
  };
  const onSlidePointerUp = async (e) => {
    const p = downPointRef.current;
    downPointRef.current = null;
    if (!p || e.pointerId !== p.pointerId) return;
    /* A commit/spring-back animation already in flight owns the
       track — a second pointerup in that window does nothing. */
    if (animatingRef.current) return;
    /* Drag-follow release: the gallery rule. A horizontal-dominant
       drag past a third of the box width COMMITS — the track slides fully
       to the adjacent slide and only then does the index swap (the
       swap awaits the slide-out, otherwise the new slide would
       appear at centre instantly and the slide would be lost).
       Anything less springs back to 0 with no index change. Under
       reduced motion both release animations are instant. A commit
       is a manual change, so the 7s manual pause applies. */
    if (draggingRef.current && dragRef.current) {
      draggingRef.current = false;
      const width = dragRef.current.width;
      dragRef.current = null;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      const commit = Math.abs(dx) > Math.abs(dy) && Math.abs(dx) >= width * COMMIT_FRACTION;
      if (!commit) {
        animatingRef.current = true;
        try {
          if (reducedMotion) {
            trackX.set(0);
          } else {
            trackAnimRef.current = animate(trackX, 0, SPRING_BACK);
            await trackAnimRef.current;
          }
        } catch {
          trackX.set(0);
        } finally {
          animatingRef.current = false;
        }
        return;
      }
      const dir = dx < 0 ? 1 : -1;
      manualNav(() => slideTo(indexRef.current + dir, dir));
      return;
    }
    dragRef.current = null;
    /* draggedRef stays true on purpose: the click that follows this
       release must be suppressed (see onClick). */
  };
  const onSlidePointerCancel = (e) => {
    if (downPointRef.current?.pointerId === e.pointerId) {
      downPointRef.current = null;
      /* An interrupted drag is neither a tap nor a swipe: the track
         returns to 0 at once (no animation — the gesture is dead)
         and the drag state is forgotten. */
      if (draggingRef.current) {
        draggingRef.current = false;
        dragRef.current = null;
        stopTrackAnim();
        trackX.set(0);
      }
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={`${repoName} screenshots`}
        className="group relative -mx-6 -mt-6 mb-6 aspect-[16/9] touch-pan-y overflow-hidden sm:-mx-7 sm:-mt-7"
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
        {/* Drag track: three cells in a row — previous / current /
          next — each exactly the box width. The track is shifted
          left by one box width (marginLeft -100%), so the current
          cell sits in the frame and the neighbours wait just
          outside it; the track's x (a motion value, written by the
          pointer handlers) then slides them through. Each cell
          clips its own image, so the split between the outgoing
          and incoming slide stays clean. */}
        <motion.div style={{ x: trackX, marginLeft: '-100%' }} className="flex h-full w-full">
          <div aria-hidden="true" className="h-full w-full shrink-0 overflow-hidden">
            {cellContent(prevSrc, prevShown, false)}
          </div>
          <div
            role="button"
            tabIndex={0}
            aria-label={`View ${repoName} screenshot ${index + 1} of ${count} full screen`}
            className="h-full w-full shrink-0 cursor-zoom-in overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-inset"
            onPointerDown={onSlidePointerDown}
            onPointerMove={onSlidePointerMove}
            onPointerUp={onSlidePointerUp}
            onPointerCancel={onSlidePointerCancel}
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
            {cellContent(images[index], index, true)}
          </div>
          <div aria-hidden="true" className="h-full w-full shrink-0 overflow-hidden">
            {cellContent(nextSrc, nextShown, false)}
          </div>
        </motion.div>

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
              onClick={() => manualNav(slidePrev)}
              aria-label="Previous image"
              className="absolute left-2.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => manualNav(slideNext)}
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
                onClick={() => {
                  /* Tapping the active dot changes nothing — it only
                   pauses auto-advance, as before. Any other dot
                   slides the track to exactly that slide. */
                  if (i === index) {
                    manualNav(() => {});
                    return;
                  }
                  manualNav(() => slideTo(i, i > index ? 1 : -1));
                }}
                className="group flex h-6 w-6 items-center justify-center"
              >
                <span
                  aria-hidden
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === index ? 'w-4 bg-accent' : 'w-1.5 bg-white/60 group-hover:bg-white'
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>

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

/* Memoized (P7): the parent re-renders on every scroll-spy change,
   and this slideshow's props — the repo's images array and name —
   are referentially stable across those renders, so a parent
   re-render must not re-run this component's render. Memo only
   skips the render; the component's own state (index, observers,
   timers, drag refs) is untouched. */
export const ProjectSlideshow = memo(ProjectSlideshowInner);
