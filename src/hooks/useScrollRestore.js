import { useEffect } from 'react';
import { getLenis } from '../utils/smoothScroll';
import { NAV_OFFSET_PX } from '../utils/navOffset';

/**
 * Manual scroll restoration — the browser's own restore cannot be
 * trusted on this page, and the reload landing on the wrong
 * section (2026-11-09) is the proof.
 *
 * ── Why the browser gets it wrong ──
 * On a reload Chrome restores the saved scroll offset while the
 * document is still SHORT — the sections below the hero are
 * React.lazy chunks, so at restore time the page is just the
 * hero (~1300px tall, max scroll ≈ 600px in a 700px viewport).
 * The saved offset (e.g. 1850 for Projects, 3000 mid-page) is
 * CLAMPED to that short document's max scroll, and Chrome never
 * re-applies the restore once the sections mount and the page
 * grows to ~6900px. The user lands on About instead of Projects
 * — measured live: reload from 1850 → 602, from 3000 → 602,
 * 3/3 trials, with and without a hash, with and without Lenis.
 * (The hash is not the cause — a reload with the hash stripped
 * lands at 602 too — and neither is Lenis: reduced motion, no
 * Lenis instance, lands at 602 as well.)
 *
 * ── What this hook does ──
 * 1. `history.scrollRestoration = 'manual'` (also set in
 *    main.jsx, before React renders) so the browser does not
 *    fight the restore below.
 * 2. Saves the scroll position continuously (rAF-throttled
 *    scroll listener + pagehide/visibilitychange) into
 *    sessionStorage. The saved pixel offset is the ground truth
 *    of where the user was — it beats the URL hash, which the
 *    scroll-spy can leave stale (see useActiveSection).
 * 3. After the layout stops moving (scrollHeight stable for
 *    300ms, fonts ready, 5s hard cap), restores instantly:
 *      - reload / back-forward + a saved offset → that offset
 *        (clamped to the new max scroll);
 *      - fresh navigation + a hash → the hash target's offset
 *        minus NAV_OFFSET_PX (a deep link);
 *      - otherwise → no move, but Lenis is still synced to the
 *        window (see below).
 *    The restore goes through Lenis (`scrollTo(top, { immediate:
 *    true })`) when it exists, so Lenis's animatedScroll /
 *    targetScroll land exactly on the restored position — a stale
 *    Lenis target is what made the first wheel after a reload
 *    jump the page upward (the second reported bug). Under
 *    reduced motion (no Lenis) it is a native instant scrollTo.
 *    "Layout stops moving" is gated on the lazy sections actually
 *    being mounted (all sectionIds present in the DOM) — height
 *    stability alone is NOT enough: the hero-only height can sit
 *    stable for 300ms while the section chunks are still in
 *    flight, and restoring then clamps the offset to the short
 *    page (measured: fix v1 failed 1/3 trials this way, landing
 *    at 602). A re-check 1s / 2.5s after the restore re-applies
 *    the intended offset if the page grew underneath it and the
 *    user has not scrolled since.
 * 4. If the user scrolls (wheel / touch / scroll keys) before
 *    the restore fires, the restore is cancelled — the user took
 *    over, and the hook must not yank the page back.
 */
const SAVE_KEY = 'portfolio_scroll_y';
const SETTLE_POLL_MS = 100;
const SETTLE_STABLE_MS = 300;
const LOAD_WAIT_MS = 3000;
const SETTLE_TIMEOUT_MS = 5000;

export function useScrollRestore(sectionIds = []) {
  useEffect(() => {
    try {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
    } catch {
      /* History API unavailable — the manual restore below
         still runs; only the browser's own restore is left on. */
    }

    /* ── Save the position as the user scrolls ── */
    let saveRaf = 0;
    const save = () => {
      saveRaf = 0;
      try {
        sessionStorage.setItem(SAVE_KEY, String(Math.round(window.scrollY)));
      } catch {
        /* Storage unavailable (private mode, full) — the restore
           falls back to the hash target below. */
      }
    };
    const onScroll = () => {
      if (saveRaf) return;
      saveRaf = requestAnimationFrame(save);
    };
    const onHide = () => save();
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);

    /* ── Restore after the layout settles ── */
    let cancelled = false;
    let timer = 0;

    const cancel = () => {
      cancelled = true;
    };
    /* The user took over before the restore fired — do not yank
       the page back. Wheel / touch are the scroll inputs; the
       key list is the keys that scroll (Tab and friends must not
       cancel a restore). One-shot: only the first input matters. */
    window.addEventListener('wheel', cancel, { passive: true, once: true });
    window.addEventListener('touchstart', cancel, {
      passive: true,
      once: true,
    });
    const onKeyDown = (e) => {
      if (
        e.key === 'ArrowDown' ||
        e.key === 'ArrowUp' ||
        e.key === 'PageDown' ||
        e.key === 'PageUp' ||
        e.key === 'Home' ||
        e.key === 'End' ||
        e.key === ' '
      ) {
        cancel();
      }
    };
    window.addEventListener('keydown', onKeyDown, { once: true });

    /* What kind of load is this? Only a reload / back-forward has
       a position worth restoring from the saved offset. A fresh
       navigation (link, typed URL) starts at the top — or at its
       hash target if it has one. */
    let navType;
    try {
      navType = performance.getEntriesByType('navigation')[0]?.type ?? '';
    } catch {
      navType = '';
    }

    let savedY = null;
    try {
      const raw = sessionStorage.getItem(SAVE_KEY);
      const n = raw === null ? NaN : Number(raw);
      if (Number.isFinite(n) && n > 0) savedY = n;
    } catch {
      savedY = null;
    }

    const hash = window.location.hash;
    const isReload =
      navType === 'reload' || navType === 'back_forward';
    const restoreSaved = isReload && savedY !== null;
    const restoreHash = !restoreSaved && hash.length > 1;

    /* Recheck timers (restore safety net) + load tracking — the
       tick below fires the restore only once the lazy sections
       are mounted AND the document has loaded (or the wait cap
       passed), so the restore can never run against the
       hero-only layout. */
    const recheckTimers = [];
    let loaded = document.readyState === 'complete';
    const onLoad = () => {
      loaded = true;
    };
    window.addEventListener('load', onLoad);

    const restore = () => {
      if (cancelled) return;
      let intendedTop;
      if (restoreHash) {
        const el = document.getElementById(hash.slice(1));
        if (!el) return; /* Hash target never mounted — stay put. */
        intendedTop =
          el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET_PX;
      } else if (restoreSaved) {
        intendedTop = savedY;
      } else {
        /* Nothing to restore — but still sync Lenis to the window
           once the layout settles, so its target can never be
           stale relative to the actual scroll position. */
        intendedTop = window.scrollY;
      }
      const clampTop = (value) => {
        const max = Math.max(
          0,
          document.documentElement.scrollHeight - window.innerHeight,
        );
        return Math.max(0, Math.min(value, max));
      };
      const applyScroll = (top) => {
        const lenis = getLenis();
        if (lenis) {
          /* Immediate: no animation, and Lenis's animatedScroll /
             targetScroll land exactly on the restored position. */
          lenis.scrollTo(top, { immediate: true });
        } else {
          window.scrollTo({ top, behavior: 'auto' });
        }
      };
      const top = clampTop(intendedTop);
      applyScroll(top);
      /* Safety net for a page that grows after the restore (a
         late-mounting chunk or late data) or a late browser yank
         back to the clamped offset: if the intended offset is now
         reachable and the page sits more than 10px away from it,
         re-apply it. The only guard is `cancelled` — set by any
         wheel / touch / scroll-key input, which covers every
         normal way a user takes over. (An earlier version also
         required the page not to have moved since the restore,
         but that guard blocked recovery from exactly the late
         yank this net exists for: a yank and a user scroll look
         the same by position alone, and the input listeners are
         the correct discriminator. The one input they miss —
         dragging the scrollbar — can only move the user back to
         their own pre-reload position.) */
      if (restoreSaved || restoreHash) {
        const recheck = (delay) => {
          const t = window.setTimeout(() => {
            if (cancelled) return;
            const want = clampTop(intendedTop);
            if (Math.abs(want - window.scrollY) > 10) {
              applyScroll(want);
            }
          }, delay);
          recheckTimers.push(t);
        };
        recheck(1000);
        recheck(2500);
        recheck(5000);
      }
    };

    /* Fonts can shift the layout after the height looks stable,
       so the restore waits for them too (capped — a slow font
       must not hold the restore past the settle timeout). */
    let fontsReady;
    try {
      fontsReady = Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
    } catch {
      fontsReady = Promise.resolve();
    }

    const start = performance.now();
    let lastH = document.documentElement.scrollHeight;
    let stableSince = start;
    const tick = () => {
      if (cancelled) return;
      const h = document.documentElement.scrollHeight;
      const now = performance.now();
      if (h !== lastH) {
        lastH = h;
        stableSince = now;
      }
      /* The lazy sections must be mounted — height stability
         alone lies while their chunks are still in flight (the
         hero-only page is stable, and restoring against it
         clamps the offset to ~602). Likewise the document must
         have loaded, or the load-wait cap must have passed. The
         hard timeout is the last resort: restore clamped rather
         than not at all. */
      const sectionsReady =
        sectionIds.length === 0 ||
        sectionIds.every((id) => document.getElementById(id));
      const settled = now - stableSince >= SETTLE_STABLE_MS;
      const loadedEnough = loaded || now - start >= LOAD_WAIT_MS;
      const timedOut = now - start >= SETTLE_TIMEOUT_MS;
      if ((sectionsReady && settled && loadedEnough) || timedOut) {
        fontsReady.then(() => {
          if (!cancelled) restore();
        });
        return;
      }
      timer = window.setTimeout(tick, SETTLE_POLL_MS);
    };
    timer = window.setTimeout(tick, SETTLE_POLL_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      recheckTimers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener('load', onLoad);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchstart', cancel);
      window.removeEventListener('keydown', onKeyDown);
      if (saveRaf) cancelAnimationFrame(saveRaf);
    };
  }, []);
}
