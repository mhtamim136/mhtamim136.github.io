import { useEffect, useState } from 'react';

/**
 * Live media-query match — one hook for every `matchMedia` gate.
 *
 * Replaces the copy-pasted pattern (create the list, read
 * `.matches`, subscribe to 'change', unsubscribe on cleanup) that
 * lived in Magnetic, Spotlight, ProjectSlideshow and useLenis.
 * The initial state reads the query synchronously, so the first
 * render already has the right value — no mount-then-correct
 * flash. Changes update live, so toggling the OS setting takes
 * effect without a reload.
 *
 * NOT used where the check is deliberately one-time:
 * BackgroundBlobs (mount-only gate — a live update could freeze
 * a blob mid-transform under reduced motion, see its comment),
 * PhotoLightbox's fine-pointer read (frozen at open), and the
 * per-call reads in useTheme / smoothScrollTo (not render state
 * at all — a hook cannot live in a plain function).
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const onChange = (e) => setMatches(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
