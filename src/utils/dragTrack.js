/**
 * Shared drag constants + release-animation params for the
 * project slideshow (ProjectSlideshow.jsx) and the photo
 * lightbox (PhotoLightbox.jsx) drag tracks. One source of truth
 * so the two tracks keep the same feel — same latch, same commit
 * fraction, same spring-back and commit-slide. Values only; no
 * logic lives here.
 */

/* Swipe vs tap: a pointer move of at least this far marks a drag,
   so the release click is suppressed. */
export const SWIPE_THRESHOLD = 50; /* px */

/* Drag-follow latch: a horizontal drag latches as a drag once it is
   horizontal-dominant and at least this far — below it the gesture
   is still a tap (the track does not move, the release click
   closes/zooms (lightbox) or opens the lightbox (slideshow) as
   before). 10px keeps the follow feeling glued to the finger;
   SWIPE_THRESHOLD still distinguishes tap vs drag for click
   suppression in general. */
export const DRAG_LATCH = 10; /* px */

/* Drag-follow commit: a drag must pass a third of the container/box
   width to commit to the next/previous photo/slide (the gallery
   rule); anything less springs back. */
export const COMMIT_FRACTION = 0.33;

/* Release animations: a short drag springs back to 0; a commit
   slides the track fully to the adjacent photo/slide. */
export const SPRING_BACK = { type: 'spring', stiffness: 400, damping: 32 };
export const COMMIT_SLIDE = { duration: 0.22, ease: [0.32, 0.72, 0, 1] };
