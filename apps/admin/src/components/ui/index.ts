/**
 * Shared preview primitives for bounding unbounded content. Pair with the
 * tokens in `@/lib/content-density`. New preview surfaces (cards, lists,
 * dashboard widgets, AI review panels) should reach for these instead of
 * bespoke clamp CSS.
 */
export { ClampedText } from "./clamped-text";
export { FadeOverflow } from "./fade-overflow";
export { ExpandablePreview } from "./expandable-preview";
