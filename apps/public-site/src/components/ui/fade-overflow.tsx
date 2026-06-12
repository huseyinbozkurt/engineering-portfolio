import type { CSSProperties, ReactNode } from "react";

import { CARD_MAX_CONTENT_H } from "@/lib/content-density";

interface FadeOverflowProps {
  children: ReactNode;
  /** Tailwind max-height class that caps the clipped height. */
  maxHeight?: string;
  /** Bottom fade height, in rem. */
  fadeRem?: number;
  className?: string;
}

/**
 * Clips long structured / rich content to a fixed height with a soft bottom
 * fade. The fade is a CSS mask, so it works on ANY background without colour
 * matching (glass panels, gradients, plain cards alike).
 *
 * Render the “read more / view full” CTA OUTSIDE this component so it always
 * stays visible — the mask fades whatever it wraps.
 *
 * For variable-length content where short content should not fade, prefer
 * ClampedText (line-clamp) which only truncates on overflow.
 */
export function FadeOverflow({
  children,
  maxHeight = CARD_MAX_CONTENT_H,
  fadeRem = 2.5,
  className = "",
}: FadeOverflowProps) {
  const mask = `linear-gradient(to bottom, #000 calc(100% - ${fadeRem}rem), transparent)`;
  const style: CSSProperties = { maskImage: mask, WebkitMaskImage: mask };

  return (
    <div className={`overflow-hidden ${maxHeight} ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}
