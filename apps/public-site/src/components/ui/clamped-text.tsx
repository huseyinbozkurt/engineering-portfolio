import type { ElementType, ReactNode } from "react";

import { CLAMP_CLASS, PREVIEW_TITLE_LINES, type ClampLines } from "@/lib/content-density";

interface ClampedTextProps {
  children: ReactNode;
  /** Lines to show before truncating with an ellipsis. Defaults to the title budget. */
  lines?: ClampLines;
  /** Element/tag to render. Defaults to <p>. */
  as?: ElementType;
  className?: string;
  /** Optional native tooltip exposing the full text when it is clamped. */
  title?: string;
}

/**
 * Truncates short text (titles, subtitles, excerpts, summaries) to a fixed
 * number of lines. `line-clamp` only ellipsizes when the text actually
 * overflows, so short content is left untouched. `break-words` keeps unbroken
 * long tokens (URLs, IDs) from forcing horizontal overflow.
 */
export function ClampedText({
  children,
  lines = PREVIEW_TITLE_LINES,
  as: Tag = "p",
  className = "",
  title,
}: ClampedTextProps) {
  return (
    <Tag className={`${CLAMP_CLASS[lines]} break-words ${className}`.trim()} title={title}>
      {children}
    </Tag>
  );
}
