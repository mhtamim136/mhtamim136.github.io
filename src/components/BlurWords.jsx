import { motion, useReducedMotion } from 'framer-motion';

/**
 * Blur + rise word-by-word reveal — Direction A hero entrance.
 *
 * Each word rises ~24px while its blur pulls from 8px to sharp,
 * on a spring (stiffness 260 / damping 26), staggered 70ms. The
 * focus pull is what makes this feel premium where the old masked
 * slide felt flat: the words arrive like a camera finding focus,
 * not like a curtain lifting.
 *
 * ── Timing ──
 * 0.07s stagger, spring settle ≈ 0.3s after each word's delay.
 * HeroSection passes baseDelay so the name (3 words) and the
 * title (4 words) form one continuous sequence with the rest of
 * the hero; the whole hero settles in ~1s, then stays still.
 *
 * ── Limits respected ──
 * Blur ONLY on the name/title words (never on the rest of the
 * hero, never on everything). Word-by-word, NOT letter-by-letter.
 * NO scale on text, no rotation, no extra glow, no 3D tilt, no
 * parallax. Transform + filter + opacity only — no layout shift.
 *
 * ── Reduced motion ──
 * App is wrapped in <MotionConfig reducedMotion="user">, but that
 * only disables transform/layout animations — a filter (blur)
 * animation would still run. So this component gates itself
 * explicitly with useReducedMotion: under reduced motion it renders
 * plain spans at the final state, no blur, no rise, no fade.
 * (Verified in the reduced-motion CDP run: computed filter is
 * 'none' and opacity is 1 from the first paint.)
 *
 * ── Never stuck hidden or blurred ──
 * Plain initial → animate on mount; framer-motion always resolves
 * to the animate target. If the tab is hidden at load, the
 * animation simply resumes and completes when it becomes visible.
 */
const SPRING = { type: 'spring', stiffness: 260, damping: 26 };
const STAGGER = 0.07;

export function BlurWords({ words, baseDelay = 0, className }) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={`${w.text}-${i}`}>
          {reduceMotion ? (
            <span className={`inline-block ${w.className ?? ''}`}>{w.text}</span>
          ) : (
            <motion.span
              className={`inline-block will-change-transform ${w.className ?? ''}`}
              style={{ willChange: 'transform, filter' }}
              initial={{ y: 24, opacity: 0, filter: 'blur(8px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              transition={{ ...SPRING, delay: baseDelay + i * STAGGER }}
            >
              {w.text}
            </motion.span>
          )}
          {i < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </span>
  );
}
