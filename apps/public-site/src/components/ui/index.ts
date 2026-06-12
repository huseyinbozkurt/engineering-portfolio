/**
 * Shared preview primitives for bounding unbounded content. Pair with the
 * tokens in `@/lib/content-density`. New preview surfaces (cards, lists,
 * timelines, sidebars) should reach for these instead of bespoke clamp CSS.
 */
export { ClampedText } from "./clamped-text";
export { FadeOverflow } from "./fade-overflow";
