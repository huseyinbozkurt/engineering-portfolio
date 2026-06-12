"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

interface ExpandablePreviewProps {
  children: ReactNode;
  /** Collapsed height in px. Content taller than this earns a "Show more" toggle. */
  collapsedHeight?: number;
  className?: string;
  moreLabel?: string;
  lessLabel?: string;
}

/**
 * Opt-in expandable preview for long admin content (AI summaries, findings,
 * notes). Collapsed by default so the server / first paint never flashes
 * full-height, with a subtle bottom fade. After hydration it measures the
 * content: short content drops the clamp entirely, long content reveals an
 * accessible Show more / Show less toggle. Respects prefers-reduced-motion.
 *
 * Never auto-expands based on content length — expansion is always user-driven.
 */
export function ExpandablePreview({
  children,
  collapsedHeight = 180,
  className = "",
  moreLabel = "Show more",
  lessLabel = "Show less",
}: ExpandablePreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  // Assume overflow until measured so the first paint renders collapsed.
  const [overflowing, setOverflowing] = useState(true);
  const [fullHeight, setFullHeight] = useState<number | null>(null);

  const measure = useCallback(() => {
    const el = contentRef.current;
    if (!el) {
      return;
    }
    // scrollHeight reports the full content height even while clipped.
    setFullHeight(el.scrollHeight);
    setOverflowing(el.scrollHeight > collapsedHeight + 4);
  }, [collapsedHeight]);

  useEffect(() => {
    measure();
    const el = contentRef.current;
    if (!el || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  const collapsed = overflowing && !expanded;
  const mask = "linear-gradient(to bottom, #000 calc(100% - 2.5rem), transparent)";

  const style: CSSProperties = {
    maxHeight: !overflowing ? undefined : expanded ? (fullHeight ?? undefined) : collapsedHeight,
    ...(collapsed ? { maskImage: mask, WebkitMaskImage: mask } : {}),
  };

  return (
    <div className={className}>
      <div
        ref={contentRef}
        className="overflow-hidden transition-[max-height] duration-300 ease-ui motion-reduce:transition-none"
        style={style}
      >
        {children}
      </div>
      {overflowing ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="ui-btn-ghost mt-2"
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      ) : null}
    </div>
  );
}
