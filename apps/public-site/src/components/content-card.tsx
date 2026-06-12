import Link from "next/link";

import { ClampedText } from "@/components/ui";
import { PREVIEW_EXCERPT_LINES, PREVIEW_TITLE_LINES } from "@/lib/content-density";

interface ContentCardProps {
  title: string;
  description: string;
  href?: string | undefined;
  meta?: string | undefined;
}

export function ContentCard({ title, description, href, meta }: ContentCardProps) {
  const content = (
    <article className="glass-panel h-full rounded-lg p-5 transition hover:border-violet-300/40 hover:bg-white/8">
      {meta ? (
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-violet-300">
          {meta}
        </p>
      ) : null}
      <ClampedText
        as="h3"
        lines={PREVIEW_TITLE_LINES}
        title={title}
        className="text-lg font-semibold text-ink"
      >
        {title}
      </ClampedText>
      {description ? (
        <ClampedText lines={PREVIEW_EXCERPT_LINES} className="mt-3 text-sm leading-6 text-muted">
          {description}
        </ClampedText>
      ) : null}
    </article>
  );

  if (!href) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}
