import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { animate, motion, useMotionValue, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

/**
 * Minimal photo lightbox for the hero portrait (Instagram-style).
 *
 * v2 — ROUND + DESKTOP ZOOM (Tamim, 2026-11-09):
 * - The opened photo is a CIRCLE, like Instagram's profile-pic view and
 *   like the hero avatar itself. Diameter min(92vw, 80vh, 560px), so it
 *   always fits the viewport. object-position center 20% keeps the head
 *   visible in the crop (same as the avatar). No buttons/text under the
 *   photo — Instagram's Follow/Share-profile UI is NOT copied.
 * - DESKTOP ZOOM (pointer: fine only — wheel + precise clicks need a
 *   mouse): click the photo zooms in one step (+0.5: 1 -> 1.5 -> 2; at
 *   max the next click resets to 1, so the user is never stuck zoomed).
 *   Wheel on the photo zooms continuously, clamped [1, 2]. Click or
 *   wheel on the BACKDROP closes (zoom out to normal = back to the hero
 *   view). Escape closes. NO pan/drag while zoomed — centre zoom only;
 *   for a face portrait the centre IS the face.
 * - MAX ZOOM 2 is a quality cap: the source photo is 880px wide, the
 *   circle displays at ~560px, so 2x renders ~1120px from an 880px
 *   source (mild 1.27x upscale, acceptable). Beyond 2x it would
 *   visibly blur. If Tamim ever provides a higher-res photo the cap
 *   can rise.
 * - TOUCH (coarse pointer): tap the photo closes (v1 behaviour),
 *   but zoom is available through the two standard mobile gestures
 *   — pinch to zoom and double-tap to toggle zoom (2026-11-09, see
 *   below). A single tap waits 250 ms before closing so a second
 *   tap can still be recognised as a double-tap.
 * - Behaviour change vs v1: click-on-photo NO LONGER closes on
 *   desktop (it zooms now). Close is backdrop click / backdrop wheel /
 *   Escape.
 * - The large variant loads ONLY on click: this component (and its
 *   <picture>) mounts only while open, so no 800w/880w request happens
 *   before the first open.
 * - Reduced motion: instant open/close and instant zoom steps, no
 *   scale/fade/transition at all.
 * - Accessibility: role="dialog" aria-modal, Escape closes, focus moves
 *   into the dialog on open (Avatar.jsx returns it to the avatar on
 *   close), Tab cycles between the dialog and the close button (the
 *   two focusable stops), body scroll locks while open and is restored
 *   on unmount.
 * - Close button (Tier 2): a visible × in the top-right corner, so
 *   mouse users don't have to discover click-anywhere. It stops
 *   propagation — clicking it closes without zooming — and it is a
 *   real <button> with a visible focus ring.
 * - Rectangular variant (Tier 4, `shape="rect"`): project
 *   screenshots open in a 16:9 rectangle (up to 900px wide)
 *   instead of the portrait circle, showing the whole image
 *   (object-contain over a blurred copy of the same image —
 *   a tall or small screenshot is never cropped or over-zoomed).
 *   Same zoom, same close behaviour (tap closes on touch, click
 *   zooms on desktop), same Tab cycle. The circle stays the
 *   default — the hero portrait is untouched (its cover crop
 *   and frame zoom are exactly as before).
 * - Keyboard navigation (project screenshots only, 2026-11-09):
 *   when `images` + `index` + `onNavigate` are passed, ArrowLeft /
 *   ArrowRight move to the previous / next screenshot (wrapping
 *   around), visible prev/next buttons do the same for mouse and
 *   touch, and a counter shows "n / total". The hero portrait
 *   passes none of those props, so it is unchanged — no arrows, no
 *   buttons, no counter. Zoom resets to 1 on every navigation.
 * - Swipe to navigate (project screenshots only, 2026-11-09): a
 *   horizontal swipe (≥ 50px, horizontal-dominant) on the photo
 *   moves to the next (swipe left) / previous (swipe right)
 *   screenshot, same direction and same 50px threshold as the
 *   slideshow's own swipe. A light tap is NOT a swipe: touch tap
 *   still closes, desktop click still zooms. The swipe is tracked
 *   with plain pointer events on the photo div (see onPhotoClick):
 *   a drag sets `swipedRef`, which the click that follows the
 *   drag must check first — otherwise the release click would
 *   close (touch) or zoom (desktop) right after navigating.
 *   No drag-follow animation: the photo sits inside a zoom
 *   scale() transform, so navigation happens on release only.
 *   Two platform gotchas, both fixed here: (1) touch needs
 *   `touch-none` on the photo div, or the browser takes over
 *   the touch for panning and fires pointercancel mid-swipe;
 *   (2) mouse needs `draggable={false}` on the <img>, or the
 *   browser starts a native image drag and fires pointercancel
 *   after the first move. Both are scoped to navigation
 *   (touch-none) / harmless no-ops (draggable) for the hero.
 * - Pinch + double-tap zoom (touch, 2026-11-09): pinch with two
 *   fingers scales the zoom continuously, clamped [1, 2] like
 *   desktop (centre zoom only, no pan); double-tap toggles 1 ↔ 2.
 *   The photo div is `touch-none` ALWAYS now (pinch needs it on
 *   the hero photo too, or the browser takes over the touch stream
 *   and fires pointercancel mid-pinch — the same gotcha as the
 *   swipe work). Tap-to-close still works: it is a click, which
 *   touch-action does not affect. A pinch never navigates and
 *   never closes; its release click(s) are suppressed by the same
 *   swipedRef the swipe uses — and swipedRef is cleared only by
 *   the next pointerdown, because a two-finger gesture can fire
 *   one click per finger.
 * - Gallery drag-follow (project screenshots only, 2026-11-09):
 *   the photo container holds a three-cell track (previous /
 *   current / next, each exactly the container width, at -100% /
 *   0 / +100% via a -100% margin on the track) and a horizontal
 *   drag moves the track WITH the finger, 1:1 — pull halfway and
 *   you see half the old photo and half the next one, exactly
 *   like a phone gallery. The old 50px navigate-on-release is
 *   gone: on release a drag past ~50% of the container width
 *   commits (the track slides fully to the adjacent photo, THEN
 *   it navigates and the track resets to 0) and anything less
 *   springs back. The zoom lives on each CELL now (same scale on
 *   all three, so a drag while zoomed shows the next photo at
 *   the same zoom), each cell clips its own image
 *   (overflow-hidden), so the split stays clean at any zoom.
 *   The hero portrait has no track — a drag there does nothing,
 *   as before. Keyboard arrows and the prev/next buttons still
 *   navigate instantly, with no drag animation.
 */
const SWIPE_THRESHOLD = 50; /* Same value as the slideshow's swipe. */
/* Touch tap timing: a single tap waits this long before closing, so
   a second tap landing nearby can still be recognised as a
   double-tap (the standard gallery tradeoff — every gallery app
   waits). The second tap must land within DOUBLE_TAP_SLOP of the
   first to count. */
const DOUBLE_TAP_DELAY = 250; /* ms */
const DOUBLE_TAP_SLOP = 30; /* px */
/* Drag-follow: a horizontal drag latches as a drag once it is
   horizontal-dominant and at least this far — below it the
   gesture is still a tap (the track does not move, the release
   click closes/zooms as before). 10px keeps the follow feeling
   glued to the finger; the old 50px SWIPE_THRESHOLD still
   distinguishes tap vs drag for click suppression in general. */
const DRAG_LATCH = 10; /* px */
/* Drag-follow commit: a drag must pass half the container width
   to commit to the next/previous photo (the gallery rule);
   anything less springs back. */
const COMMIT_FRACTION = 0.5;
export function PhotoLightbox({ manifest, src, alt, onClose, shape = 'circle', images, index, onNavigate }) {
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  /* Swipe tracking (same pattern as the slideshow's swipe guard):
     downPointRef records where the pointer went down (first pointer
     only); swipedRef marks a drag, so the click that follows it can
     be told apart from a plain tap. */
  const downPointRef = useRef(null);
  const swipedRef = useRef(false);
  /* Pinch tracking: every pointer currently down on the photo
     (pointerId → { x, y }). Two pointers = a pinch; the pinch
     itself (the two ids, the finger distance when it started, the
     zoom then) lives in pinchRef. */
  const pointersRef = useRef(new Map());
  const pinchRef = useRef(null);
  /* Touch tap bookkeeping (see onPhotoClick): a pending close
     timer — a single tap waits DOUBLE_TAP_DELAY before closing so
     a second tap can become a double-tap; whether the tap that
     just ended is the second of a double-tap; where/when the last
     tap landed. */
  const tapTimerRef = useRef(null);
  const doubleTapRef = useRef(false);
  const lastTapRef = useRef(null);
  /* Drag-follow tracking (project lightbox only): the track's
     horizontal offset as a Framer Motion value — written in the
     pointermove handler, so the photos follow the finger with no
     re-render per move. containerRef measures the photo frame at
     drag start (the commit threshold is half that width);
     dragRef holds the width for the gesture in progress;
     draggingRef latches once the gesture is a horizontal drag;
     animatingRef guards the commit/spring-back animation in
     flight (a new pointer gesture is ignored until it settles);
     trackAnimRef holds the running animation controls so a pinch
     can stop it. */
  const trackX = useMotionValue(0);
  const containerRef = useRef(null);
  const dragRef = useRef(null);
  const draggingRef = useRef(false);
  const animatingRef = useRef(false);
  const trackAnimRef = useRef(null);

  /* Stops a running track animation, if any. Called before the
     track is set directly (pinch start, pointer cancel). */
  const stopTrackAnim = () => {
    trackAnimRef.current?.stop();
    trackAnimRef.current = null;
  };

  /* Clears a pending tap-close timer, if any. Called when a swipe
     or pinch starts, when a double-tap is recognised, and before a
     fresh timer is scheduled. */
  const clearTapTimer = () => {
    if (tapTimerRef.current !== null) {
      clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
    }
  };

  /* Desktop zoom state. The component remounts on every open, so zoom
     always starts at 1 — no reset needed. */
  const [zoom, setZoom] = useState(1);
  /* Zoom needs a mouse: evaluated on mount (i.e. on open), per the
     live pointer. Headless Chrome reports (pointer: none), so zoom
     tests must run in headed Chrome under Xvfb. */
  const [finePointer] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: fine)').matches,
  );

  /* Navigation is opt-in: only when the caller passes the whole
     image list, the current position and a navigate callback (the
     project slideshow does; the hero portrait does not, so it
     behaves exactly as before — no arrows, no buttons, no
     counter). Single-image lists navigate nowhere. */
  const canNavigate =
    Array.isArray(images) &&
    images.length > 1 &&
    typeof index === 'number' &&
    typeof onNavigate === 'function';
  const goPrev = useCallback(() => {
    if (canNavigate) onNavigate((index - 1 + images.length) % images.length);
  }, [canNavigate, images, index, onNavigate]);
  const goNext = useCallback(() => {
    if (canNavigate) onNavigate((index + 1) % images.length);
  }, [canNavigate, images, index, onNavigate]);

  /* Navigating to another image resets the zoom, so the user is
     never stuck zoomed on the next image. */
  useEffect(() => {
    setZoom(1);
  }, [index]);

  /* Focus moves into the dialog on open and body scroll locks while
     open; both are restored on unmount. Mount-only: navigating
     between images must NOT re-run this (it would yank focus back
     to the dialog). */
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      /* A pending tap-close must not fire after unmount. */
      if (tapTimerRef.current !== null) {
        clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }
    };
  }, []);

  /* Escape closes; Tab cycles the focus stops (dialog → prev →
     next → close → dialog, Shift+Tab backwards); ArrowLeft /
     ArrowRight move to the previous / next image when navigation
     is on. The prev/next stops exist only then — without them
     this is the same two-stop cycle as before. Body scroll is
     locked while open, so the arrow keys scroll nothing. */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        e.preventDefault();
        const stops = [
          dialogRef.current,
          prevRef.current,
          nextRef.current,
          closeRef.current,
        ].filter(Boolean);
        const at = stops.indexOf(document.activeElement);
        const dir = e.shiftKey ? -1 : 1;
        const target = stops[(at + dir + stops.length) % stops.length];
        target?.focus();
      }
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, goPrev, goNext]);

  /* Gentle scale 0.96→1 + fade; instant when reduced motion is on. */
  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.25, ease: 'easeOut' };
  const overlayAnim = reduceMotion
    ? { initial: false }
    : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
  const photoAnim = reduceMotion
    ? { initial: false }
    : {
        initial: { opacity: 0, scale: 0.96 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.96 },
      };

  /* Swipe to navigate + pinch to zoom + gallery drag-follow.
     Plain pointer events on the photo div (pointer-type-agnostic
     — any two pointers pinch):
     pointerdown records the start (first pointer only) and
     captures the pointer so move/up keep firing if the finger
     slides off the photo; a move of ≥ SWIPE_THRESHOLD marks a
     drag; on release a horizontal-dominant drag that passed half
     the container width COMMITS — the track slides fully to the
     adjacent photo and only then does it navigate — while a
     shorter drag springs back (see onPhotoPointerUp). The drag
     leaves swipedRef true so the click that follows the drag is
     suppressed. Navigation only when canNavigate — for the hero
     a swipe navigates nowhere and the track never moves, so a
     drag never closes or zooms by accident.
     A second pointer down starts a PINCH instead: the finger
     distance and the zoom at that moment are recorded, and the
     zoom then tracks the distance ratio, clamped [1, 2] like
     desktop. A pinch never navigates and never closes; its
     release click(s) are suppressed by the same swipedRef. A
     pinch also cancels any drag-follow in progress — the track
     resets to 0 with no animation.
     Touch tap timing lives here too: a pointerdown landing near
     the last tap in time and space, while a close timer is
     pending, is the second tap of a double-tap — it cancels the
     close and the click toggles the zoom (see onPhotoClick). */
  const onPhotoPointerDown = (e) => {
    /* Track every pointer down on the photo, and capture it so
       move/up keep firing off the photo. */
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* Capture is best-effort (already-released pointer, old
         browser) — move/up still fire while over the photo. */
    }

    /* Two pointers = pinch start: record the finger distance and
       the zoom at that moment. A pinch is neither a tap nor a
       swipe: suppress the release click(s), cancel any swipe,
       forget any double-tap in progress, and cancel a pending
       tap-close (the first tap is now part of a pinch). It also
       cancels any drag-follow in progress — the track resets to
       0 with no animation, and the drag state is forgotten. */
    if (pointersRef.current.size === 2) {
      const ids = [...pointersRef.current.keys()];
      const [a, b] = [...pointersRef.current.values()];
      pinchRef.current = {
        ids,
        startDist: Math.max(
          1,
          Math.hypot(b.x - a.x, b.y - a.y),
        ),
        startZoom: zoom,
      };
      swipedRef.current = true;
      downPointRef.current = null;
      doubleTapRef.current = false;
      clearTapTimer();
      stopTrackAnim();
      trackX.set(0);
      draggingRef.current = false;
      dragRef.current = null;
      return;
    }
    if (pointersRef.current.size > 2) return; /* Third finger: ignore. */

    /* One pointer — the single-pointer behaviour. */
    downPointRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
    swipedRef.current = false;
    /* Drag-follow setup (project lightbox only): measure the
       frame once — the commit threshold is half this width. The
       drag latches as a horizontal drag in the move handler. */
    if (canNavigate) {
      const width = containerRef.current?.getBoundingClientRect().width ?? 0;
      dragRef.current = width > 0 ? { width } : null;
      draggingRef.current = false;
    }
    /* Touch only: is this the second tap of a double-tap? The
       first tap scheduled a close DOUBLE_TAP_DELAY out; a second
       tap landing near it in time and space cancels that close
       and becomes a zoom toggle (see onPhotoClick). */
    if (!finePointer && tapTimerRef.current !== null && lastTapRef.current) {
      const last = lastTapRef.current;
      if (
        Date.now() - last.time <= DOUBLE_TAP_DELAY &&
        Math.hypot(e.clientX - last.x, e.clientY - last.y) <= DOUBLE_TAP_SLOP
      ) {
        clearTapTimer();
        doubleTapRef.current = true;
      }
    }
  };
  const onPhotoPointerMove = (e) => {
    const pt = pointersRef.current.get(e.pointerId);
    if (!pt) return;
    pt.x = e.clientX;
    pt.y = e.clientY;
    /* Pinch: two pointers down — scale the zoom by the finger
       distance relative to the pinch start, clamped [1, 2]. */
    if (pinchRef.current) {
      const [id1, id2] = pinchRef.current.ids;
      const a = pointersRef.current.get(id1);
      const b = pointersRef.current.get(id2);
      if (a && b) {
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        setZoom(
          Math.min(
            2,
            Math.max(1, (pinchRef.current.startZoom * dist) / pinchRef.current.startDist),
          ),
        );
      }
      return;
    }
    /* Single pointer — the swipe tracking. */
    const p = downPointRef.current;
    if (!p || e.pointerId !== p.pointerId) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (
      !swipedRef.current &&
      Math.hypot(dx, dy) >= SWIPE_THRESHOLD
    ) {
      swipedRef.current = true;
      /* A drag is not a tap: cancel a pending tap-close and
         forget any double-tap in progress. */
      doubleTapRef.current = false;
      clearTapTimer();
    }
    /* Drag-follow (project lightbox only): once the gesture is
       horizontal-dominant, the track follows the finger 1:1,
       clamped to one container width either way. Latching also
       marks the gesture a drag (swipedRef), so the release click
       is suppressed even for a short drag that springs back —
       otherwise the spring-back would be followed by a close
       (touch) or a zoom (desktop). A drag in flight while a
       commit/spring-back animation runs is ignored. */
    if (
      canNavigate &&
      dragRef.current &&
      !pinchRef.current &&
      !animatingRef.current
    ) {
      if (
        !draggingRef.current &&
        Math.abs(dx) > Math.abs(dy) &&
        Math.abs(dx) >= DRAG_LATCH
      ) {
        draggingRef.current = true;
        swipedRef.current = true;
        doubleTapRef.current = false;
        clearTapTimer();
      }
      if (draggingRef.current) {
        const width = dragRef.current.width;
        trackX.set(Math.max(-width, Math.min(width, dx)));
      }
    }
  };
  const onPhotoPointerUp = async (e) => {
    pointersRef.current.delete(e.pointerId);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* Not captured (see pointerdown) — nothing to release. */
    }
    /* A pinch finger lifting ends the pinch: keep the final zoom,
       navigate nowhere, close nothing. The remaining finger's
       later pointerup finds downPointRef null (no navigation) and
       its release click is suppressed by swipedRef. */
    if (pinchRef.current?.ids.includes(e.pointerId)) {
      pinchRef.current = null;
      return;
    }
    const p = downPointRef.current;
    downPointRef.current = null;
    if (!p || e.pointerId !== p.pointerId) return;
    /* A commit/spring-back animation already in flight owns the
       track — a second pointerup in that window does nothing. */
    if (animatingRef.current) return;
    /* Drag-follow release (project lightbox only): the gallery
       rule. A horizontal-dominant drag past half the container
       width COMMITS — the track slides fully to the adjacent
       photo (left = next, right = prev) and only then does it
       navigate, and the track resets to 0 in the same handler
       (the new photo mounts at centre; zoom resets via the
       existing index-change effect). Anything less springs back
       to 0 with no navigation. The navigation MUST wait for the
       slide-out to finish — otherwise the new photo appears at
       centre instantly and the slide is lost. Under reduced
       motion the release animations are instant (set directly,
       no spring). If a pinch starts mid-slide it stops the
       animation and the navigation is cancelled (the track was
       already reset by the pinch). */
    if (canNavigate && draggingRef.current && dragRef.current) {
      draggingRef.current = false;
      const width = dragRef.current.width;
      dragRef.current = null;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      const commit =
        Math.abs(dx) > Math.abs(dy) && Math.abs(dx) >= width * COMMIT_FRACTION;
      animatingRef.current = true;
      try {
        if (!commit) {
          if (reduceMotion) {
            trackX.set(0);
          } else {
            trackAnimRef.current = animate(trackX, 0, {
              type: 'spring',
              stiffness: 400,
              damping: 32,
            });
            await trackAnimRef.current;
          }
          return;
        }
        const target = dx < 0 ? -width : width;
        if (reduceMotion) {
          trackX.set(target);
        } else {
          trackAnimRef.current = animate(trackX, target, {
            duration: 0.22,
            ease: [0.32, 0.72, 0, 1],
          });
          await trackAnimRef.current;
        }
        if (pinchRef.current) return; /* Pinch started mid-slide: cancel. */
        if (dx < 0) goNext();
        else goPrev();
        stopTrackAnim();
        trackX.set(0);
      } catch {
        /* Stopped mid-flight (pinch) — the track was already
           reset by the pinch; nothing more to do. */
      } finally {
        animatingRef.current = false;
      }
      return;
    }
    dragRef.current = null;
    /* swipedRef stays true on purpose: the click(s) that follow
       this release must be suppressed (see onPhotoClick). A
       two-finger gesture can fire one click per finger, so
       swipedRef is cleared only by the next pointerdown — never
       here and never in the click handler. */
  };
  const onPhotoPointerCancel = (e) => {
    pointersRef.current.delete(e.pointerId);
    if (pinchRef.current?.ids.includes(e.pointerId)) {
      pinchRef.current = null;
    }
    if (downPointRef.current?.pointerId === e.pointerId) {
      downPointRef.current = null;
      /* An interrupted drag is neither a tap nor a swipe: the
         track returns to 0 at once (no animation — the gesture
         is dead) and the drag state is forgotten. */
      if (draggingRef.current) {
        draggingRef.current = false;
        dragRef.current = null;
        stopTrackAnim();
        trackX.set(0);
      }
    }
    /* No navigation, no click suppression change: a cancelled
       gesture is neither a tap nor a swipe. (swipedRef is left
       as-is — the next pointerdown resets it.) */
  };

  /* Desktop: click the photo zooms in a step; at max it resets to 1.
     Touch: tap the photo closes (v1 behaviour) — but only after
     DOUBLE_TAP_DELAY, so a second tap landing nearby in time can
     still be recognised as a double-tap, which toggles the zoom
     instead (1 ↔ 2). stopPropagation keeps the overlay's
     click-to-close from firing.
     A drag or a pinch is NOT a tap: if the pointer moved
     ≥ SWIPE_THRESHOLD, swipedRef is true and this click (the
     release click of the swipe, or either finger's release click
     after a pinch) must do nothing — not zoom, not close.
     swipedRef is deliberately NOT cleared here: a two-finger
     gesture can fire one click per finger, and clearing it on the
     first click would let the second close the lightbox. The next
     pointerdown resets it. */
  const onPhotoClick = (e) => {
    e.stopPropagation();
    if (swipedRef.current) {
      return;
    }
    if (!finePointer) {
      if (doubleTapRef.current) {
        doubleTapRef.current = false;
        setZoom((z) => (z > 1 ? 1 : 2));
        return;
      }
      lastTapRef.current = { time: Date.now(), x: e.clientX, y: e.clientY };
      clearTapTimer();
      tapTimerRef.current = setTimeout(onClose, DOUBLE_TAP_DELAY);
      return;
    }
    setZoom((z) => (z >= 2 ? 1 : Math.min(2, z + 0.5)));
  };

  /* Desktop: wheel on the photo zooms continuously, clamped [1, 2].
     Wheel down at 1x does nothing — it stays open, never closes by
     accident. No preventDefault needed: body scroll is locked while
     the lightbox is open, so the wheel has nothing to scroll. */
  const onPhotoWheel = (e) => {
    if (!finePointer) return;
    e.stopPropagation();
    setZoom((z) => Math.min(2, Math.max(1, z - e.deltaY * 0.002)));
  };

  /* Lightbox-appropriate sizes so the browser picks 480/800/880w as
     needed. The circle displays at up to 560px (the 80vh cap binds
     below that on short viewports). The avatar's own sizes (192-288px)
     must NOT be reused here, or the browser would serve the small
     variant. */
  const lightboxSizes = '(max-width: 640px) 92vw, 560px';

  /* The circle: fixed diameter min(92vw, 80vh, 560px), overflow-hidden
     so the cover crop is a true circle. The img fills the square with
     object-cover + center 20% — the same crop as the avatar. Zoom is
     a plain scale() on this div (NOT on the motion.div above — Framer
     Motion owns that element's transform for the open animation, and
     nested transforms compose). Zoom transition 0.2s; instant under
     reduced motion.
     The rectangle (project screenshots): 16:9, up to 900px wide,
     centred crop — a screenshot is not a face, so the 20% headroom
     crop does not apply. */
  const zoomTransition = reduceMotion
    ? ''
    : 'transition-transform duration-200 ease-out';
  const objectPosition = shape === 'rect' ? 'center' : 'center 20%';
  const photoFrameClass =
    shape === 'rect'
      ? 'relative aspect-video w-[min(92vw,900px)] cursor-zoom-in overflow-hidden rounded-2xl shadow-2xl'
      : 'relative aspect-square w-[min(92vw,80vh,560px)] cursor-zoom-in overflow-hidden rounded-full shadow-2xl';
  /* Fit (2026-11-09, rect variant only): the WHOLE screenshot
     always shows — object-contain over a blurred, enlarged copy
     of the SAME image filling the frame (same URL, so no extra
     fetch — the browser cache serves the backdrop). A tall or
     small screenshot used to be over-zoomed and heavily cropped
     by object-cover in this fixed 16:9 frame; now it shows fully
     and the backdrop fills the bands — the premium gallery
     look, same fit as the slideshow. The backdrop is
     presentational (aria-hidden, pointer-events-none). The hero
     circle is untouched — it keeps its face-filling cover crop
     and its frame zoom. */
  const photo =
    manifest && !manifest.dev ? (
      <picture className="block h-full w-full">
        <source
          type="image/avif"
          srcSet={manifest.avifSrcset}
          sizes={lightboxSizes}
        />
        <source
          type="image/webp"
          srcSet={manifest.webpSrcset}
          sizes={lightboxSizes}
        />
        <img
          src={manifest.pngFallback}
          alt={alt}
          width={manifest.width}
          height={manifest.height}
          loading="eager"
          decoding="async"
          draggable={false}
          className="h-full w-full object-cover"
          style={{ objectPosition }}
        />
      </picture>
    ) : (
      <div className="relative h-full w-full overflow-hidden">
        <img
          src={manifest?.src || src}
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover blur-xl brightness-[0.85]"
          style={{ objectPosition }}
        />
        <img
          src={manifest?.src || src}
          alt={alt}
          loading="eager"
          decoding="async"
          draggable={false}
          className="relative h-full w-full object-contain"
          style={{ objectPosition }}
        />
      </div>
    );

  /* Drag-track cells (project lightbox only): the same plain
     <img> the rect variant renders today — the slideshow passes
     URL strings, so prev/next are just images[i]. Navigation
     wraps, so both neighbours always exist. Adjacent cells are
     presentational (empty alt) — the current cell keeps the real
     alt, so a screen reader hears the photo once. */
  const prevSrc = canNavigate
    ? images[(index - 1 + images.length) % images.length]
    : null;
  const nextSrc = canNavigate
    ? images[(index + 1) % images.length]
    : null;
  const cellPhoto = (srcUrl) => (
    <div className="relative h-full w-full overflow-hidden">
      <img
        src={srcUrl}
        alt=""
        aria-hidden="true"
        loading="eager"
        decoding="async"
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover blur-xl brightness-[0.85]"
        style={{ objectPosition }}
      />
      <img
        src={srcUrl}
        alt=""
        loading="eager"
        decoding="async"
        draggable={false}
        className="relative h-full w-full object-contain"
        style={{ objectPosition }}
      />
    </div>
  );

  return createPortal(
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      tabIndex={-1}
      onClick={onClose}
      /* Wheel on the backdrop closes (zoom out to normal = back to the
         hero view). Wheel on the photo never reaches here — the photo
         stops propagation and zooms instead. */
      onWheel={onClose}
      className="fixed inset-0 z-[60] flex cursor-zoom-out items-center justify-center bg-black/70 p-4 backdrop-blur-md focus-visible:outline-none"
      {...overlayAnim}
      transition={transition}
    >
      {/* Prev / next — only when navigation is on (project
          screenshots). Same dark-glass style as the × button.
          stopPropagation keeps the overlay's click-to-close from
          firing; the click navigates and never zooms (the buttons
          sit outside the photo). */}
      {canNavigate && (
        <>
          <button
            type="button"
            ref={prevRef}
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label="Previous image"
            className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 motion-reduce:transition-none"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            ref={nextRef}
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label="Next image"
            className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 motion-reduce:transition-none"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </>
      )}
      {/* Visible close button (top-right). stopPropagation keeps the
          overlay's click-to-close from firing too — the click closes
          via this button only, and never zooms (it sits outside the
          photo, so the photo's click/wheel handlers don't apply). */}
      <button
        type="button"
        ref={closeRef}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 motion-reduce:transition-none"
      >
        <X className="h-5 w-5" aria-hidden />
      </button>
      <motion.div className="flex justify-center" {...photoAnim} transition={transition}>
        <div
          ref={containerRef}
          onClick={onPhotoClick}
          onWheel={onPhotoWheel}
          onPointerDown={onPhotoPointerDown}
          onPointerMove={onPhotoPointerMove}
          onPointerUp={onPhotoPointerUp}
          onPointerCancel={onPhotoPointerCancel}
          /* Hero: the zoom scales the whole frame, exactly as
             before. Project: the frame stays fixed and the zoom
             lives on the track's cells instead (see below). */
          style={canNavigate ? undefined : { transform: `scale(${zoom})` }}
          /* touch-none ALWAYS now: without it the browser takes
             over the touch stream for panning and fires
             pointercancel mid-swipe or mid-pinch, so pointerup
             (and the navigation / zoom) never arrives. Tap-to-
             close still works — it is a click, which touch-action
             does not affect — and body scroll is locked while the
             lightbox is open, so the hero loses nothing. */
          className={`${photoFrameClass} ${canNavigate ? '' : zoomTransition} touch-none`}
        >
          {canNavigate ? (
            /* Drag track: three cells in a row — previous /
               current / next — each exactly the container width.
               The track is shifted left by one container width
               (marginLeft -100%), so the current cell sits in
               the frame and the neighbours wait just outside it;
               the track's x (a motion value, written by the
               pointer handlers) then slides them through. Each
               cell clips its own image, so the split between the
               outgoing and incoming photo stays clean at any
               zoom — the zoomed neighbour never bleeds into the
               current cell's half. */
            <motion.div
              style={{ x: trackX, marginLeft: '-100%' }}
              className="flex h-full w-full"
            >
              <div
                className={`h-full w-full shrink-0 overflow-hidden ${zoomTransition}`}
                style={{ transform: `scale(${zoom})` }}
              >
                {cellPhoto(prevSrc)}
              </div>
              <div
                className={`h-full w-full shrink-0 overflow-hidden ${zoomTransition}`}
                style={{ transform: `scale(${zoom})` }}
              >
                {photo}
              </div>
              <div
                className={`h-full w-full shrink-0 overflow-hidden ${zoomTransition}`}
                style={{ transform: `scale(${zoom})` }}
              >
                {cellPhoto(nextSrc)}
              </div>
            </motion.div>
          ) : (
            photo
          )}
        </div>
      </motion.div>
      {/* Counter — only when navigation is on. Same pill as the
          slideshow's counter chip. */}
      {canNavigate && (
        <span className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/55 px-2 py-0.5 text-[0.6875rem] font-medium tabular-nums text-white backdrop-blur-sm">
          {index + 1} / {images.length}
        </span>
      )}
    </motion.div>,
    document.body,
  );
}
