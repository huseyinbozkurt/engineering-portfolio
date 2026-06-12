/**
 * Content-density tokens — the single source of truth for how *preview*
 * surfaces (cards, lists, dashboards, timelines, sidebars, widgets, related
 * content) bound unbounded user / CMS / AI-generated content.
 *
 * Why class strings instead of raw numbers?
 *   1. Tailwind's JIT scanner reads this file (it sits under the `content`
 *      glob), so every clamp/height class referenced here is guaranteed to be
 *      generated — even when a primitive composes the class name dynamically.
 *   2. Changing a token here re-themes every surface that consumes it. Density
 *      is tuned in one place, not scattered across components.
 *
 * Consume these through the `ui/` primitives (ClampedText, FadeOverflow,
 * ExpandablePreview) rather than hand-writing clamp classes per component.
 *
 * Detail pages must NOT use these — full reading surfaces render content
 * unclipped. These tokens are strictly for the compact "preview" mode.
 */

/** Line budgets for short, single-purpose text shown in preview mode. */
export const PREVIEW_TITLE_LINES = 2;
export const PREVIEW_SUBTITLE_LINES = 2;
export const PREVIEW_EXCERPT_LINES = 3;
export const PREVIEW_BODY_LINES = 4;

/**
 * `line-clamp-N` lookup. Listed as literals so the JIT scanner emits each rule;
 * never build `line-clamp-${n}` dynamically — Tailwind cannot see those.
 */
export const CLAMP_CLASS = {
  1: "line-clamp-1",
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
  5: "line-clamp-5",
  6: "line-clamp-6",
} as const;

export type ClampLines = keyof typeof CLAMP_CLASS;

/**
 * Max heights for longer structured / rich sections rendered in preview mode
 * (clip + fade via FadeOverflow). Tuned against `text-sm`/`leading-6` bodies.
 */
export const PREVIEW_SECTION_MAX_H = "max-h-32"; // ~8rem — a single structured section (Problem, Outcome…)
export const CARD_MAX_CONTENT_H = "max-h-48"; // ~12rem — a card body
export const SIDEBAR_MAX_CONTENT_H = "max-h-64"; // ~16rem — a sidebar / popover panel
export const WIDGET_MAX_CONTENT_H = "max-h-80"; // ~20rem — a dashboard widget list (internal scroll)
