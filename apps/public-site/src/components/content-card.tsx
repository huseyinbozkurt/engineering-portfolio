import Link from "next/link";

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
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description ? (
        <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
      ) : null}
    </article>
  );

  if (!href) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}
