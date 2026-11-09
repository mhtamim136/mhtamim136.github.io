/* Single source of truth for "clear the fixed nav" (88px).
 *
 * CSS truth: `section[id] { scroll-margin-top: 5.5rem }` in
 * src/index.css — 5.5rem = 88px at the 16px root. The JS call
 * sites used 96px, so programmatic scrolls landed 8px lower than
 * native anchor jumps. Use this constant everywhere instead of a
 * magic number.
 */
export const NAV_OFFSET_PX = 88;
