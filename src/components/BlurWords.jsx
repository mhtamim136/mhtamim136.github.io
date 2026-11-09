import { useEffect } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';

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
 * ── Why the blur is clamped at 0 ──
 * The spring is underdamped (damping ratio 26 / (2·√260) ≈ 0.81),
 * so it overshoots its target by ~1.4% — for an 8px blur that is
 * ~0.11px past zero, i.e. blur(-0.11px). CSS blur() cannot be
 * negative, so the browser dropped those keyframes and logged
 * "Invalid keyframe value for property filter" (~28 frames per
 * load). The rendered result was unaffected (invalid frames are
 * dropped), but the console was polluted. The blur now rides its
 * own MotionValue driven by the SAME spring (same constants, same
 * delay), and the rendered value is clamped at 0 — only the
 * invalid tail is clipped; the visible trajectory is unchanged.
 * (RoleLine's blur is a tween and cannot overshoot, so it needs
 * no clamp — verified by grep: BlurWords is the only
 * spring-animated blur in src/.)
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

/* Clamp a spring-driven blur at 0 — the rendered value can never go
   negative. Module-level so the transformer reference is stable. */
const clampBlur = (v) => `blur(${Math.max(0, v)}px)`;

/* One word of the reveal. y/opacity ride the motion.span's animate
   prop on SPRING, exactly as before. The blur rides its own
   MotionValue driven by the SAME spring (same constants, same
   delay), so its trajectory is identical — except the rendered
   value is clamped at 0 (see header). */
function BlurWord({ text, className, delay }) {
  const blur = useMotionValue(8);
  const filter = useTransform(blur, clampBlur);

  useEffect(() => {
    const controls = animate(blur, 0, { ...SPRING, delay });
    return () => controls.stop();
  }, [blur, delay]);

  return (
    <motion.span
      className={`inline-block ${className ?? ''}`}
      style={{ willChange: 'transform, filter', filter }}
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ...SPRING, delay }}
    >
      {text}
    </motion.span>
  );
}

export function BlurWords({ words, baseDelay = 0, className }) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={`${w.text}-${i}`}>
          {reduceMotion ? (
            <span className={`inline-block ${w.className ?? ''}`}>{w.text}</span>
          ) : (
            <BlurWord text={w.text} className={w.className} delay={baseDelay + i * STAGGER} />
          )}
          {i < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </span>
  );
}
