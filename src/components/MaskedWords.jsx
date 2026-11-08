import { motion } from 'framer-motion';

/**
 * Masked word-by-word reveal — premium hero animation (#5).
 *
 * Each word sits in its own overflow-hidden mask and slides up from
 * behind it (translateY 120% → 0), staggered. Transform only — no
 * layout shift, no opacity fade, no rotation, no glow, no 3D tilt,
 * no parallax. NOT letter-by-letter: words are the unit.
 *
 * Why 120%, not 110%: the mask is taller than the word (its
 * 0.12em bottom padding makes room for descenders), so at 110%
 * the top 1.2px of the name words still peeked below the mask edge
 * at t=0 (measured: word top 278 vs mask bottom 279.2). At 120%
 * the word top sits ~5px below the mask edge — fully hidden —
 * while the extra travel is imperceptible in a 0.6s expo-out ease.
 *
 * ── Timing ──
 * 0.6s per word, 0.06s stagger, expo-out ease [0.22, 1, 0.36, 1]
 * (the same ease family as the hero's existing entrance).
 * HeroSection passes baseDelay so the name (3 words) and the
 * title (4 words) form one continuous sequence:
 *   name:  0.05 + 0 / 0.06 / 0.12       → last word settles ≈ 0.77s
 *   title: 0.23 + 0 / 0.06 / 0.12 / 0.18 → last word settles ≈ 1.01s
 * Total ≤ ~1.05s, then completely still.
 *
 * ── Descenders ──
 * Each mask carries pb-[0.12em] -mb-[0.12em]: room for descenders
 * ("p" in "Developer") without clipping, and the negative margin
 * keeps the line box exactly as tall as before.
 *
 * ── Reduced motion ──
 * App is wrapped in <MotionConfig reducedMotion="user">, so under
 * prefers-reduced-motion framer-motion renders the words at their
 * final y: 0 instantly — no animation, no hidden state. (Verified
 * in the reduced-motion CDP run.)
 *
 * ── Never stuck hidden ──
 * The animation is a plain initial → animate transform on mount;
 * framer-motion always resolves to the animate target, and there
 * is no competing animation on these elements (the old opacity
 * fade on the h1/title was removed with this change). If the tab
 * is hidden at load, the animation simply resumes and completes
 * when it becomes visible.
 */
const EASE = [0.22, 1, 0.36, 1];
const DURATION = 0.6;
const STAGGER = 0.06;

export function MaskedWords({ words, baseDelay = 0, className }) {
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={`${w.text}-${i}`}>
          <span className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom">
            <motion.span
              className={`inline-block will-change-transform ${w.className ?? ''}`}
              initial={{ y: '120%' }}
              animate={{ y: 0 }}
              transition={{
                delay: baseDelay + i * STAGGER,
                duration: DURATION,
                ease: EASE,
              }}
            >
              {w.text}
            </motion.span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </span>
  );
}
