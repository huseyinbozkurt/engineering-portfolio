import Link from "next/link";

import { EmptyPanel } from "@/components/empty-panel";

/** Read-only AI-assist metadata surfaced per record (populated by a future pipeline). */
export interface ContentAiMeta {
  contentQualityScore: number | null;
  lastAiReviewAt: Date | null;
  aiSummary: string | null;
}

export interface ContentListItem {
  id: string;
  title: string;
  description: string;
  meta?: string | undefined;
  group?: string | null | undefined;
  status?: string | undefined;
  ai?: ContentAiMeta | undefined;
  editHref?: string | undefined;
}

interface ContentListProps {
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  items: ContentListItem[];
}

function statusBadgeClasses(status: string): string {
  switch (status) {
    case "published":
      return "border-teal-300/30 bg-teal-300/15 text-teal-100";
    case "archived":
      return "border-amber-200/25 bg-amber-200/10 text-amber-200/90";
    default:
      return "border-line bg-white/[0.05] text-muted";
  }
}

function formatReviewDate(value: Date): string {
  return value.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function ContentList({
  title,
  emptyTitle,
  emptyDescription,
  items,
}: ContentListProps) {
  const hasGroups = items.some((item) => item.group);
  const groupedItems = hasGroups ? groupItems(items) : [];

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-ink">{title}</h2>
      {items.length === 0 ? (
        <EmptyPanel title={emptyTitle} description={emptyDescription} />
      ) : hasGroups ? (
        <div className="grid gap-5">
          {groupedItems.map((group) => (
            <div key={group.name} className="overflow-hidden rounded-lg border border-line">
              <div className="flex items-center justify-between gap-3 border-b border-line bg-white/[0.04] px-4 py-3">
                <h3 className="text-sm font-semibold text-ink">{group.name}</h3>
                <span className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">
                  {group.items.length}
                </span>
              </div>
              {group.items.map((item) => (
                <ContentListArticle key={item.id} item={item} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line">
          {items.map((item) => (
            <ContentListArticle key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

function ContentListArticle({ item }: { item: ContentListItem }) {
  return (
    <article className="border-b border-line bg-white/[0.025] p-4 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        {item.status ? (
          <span
            className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${statusBadgeClasses(item.status)}`}
          >
            {item.status}
          </span>
        ) : null}
        {item.meta ? <span className="text-xs text-amber-200">{item.meta}</span> : null}
        {item.editHref ? (
          <Link
            href={item.editHref}
            className="ml-auto rounded-md border border-line px-2.5 py-1 text-xs font-medium text-ink transition hover:border-teal-300/50 hover:bg-white/[0.06]"
          >
            Edit
          </Link>
        ) : null}
      </div>
      <h3 className="mt-1.5 text-sm font-semibold text-ink">{item.title}</h3>
      <p className="mt-1 text-sm leading-6 text-muted">
        {item.description || "Content coming soon."}
      </p>
      {item.ai ? (
        <dl className="mt-3 grid gap-1 rounded-md border border-dashed border-line/70 bg-white/[0.02] p-3 text-xs text-muted">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted/70">
            AI metadata (read-only)
          </p>
          <div className="flex items-center justify-between gap-3">
            <dt className="font-medium text-ink/80">Quality score</dt>
            <dd>{item.ai.contentQualityScore ?? "-"}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="font-medium text-ink/80">Last AI review</dt>
            <dd>
              {item.ai.lastAiReviewAt
                ? formatReviewDate(item.ai.lastAiReviewAt)
                : "Not yet reviewed"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink/80">AI summary</dt>
            <dd className="mt-1 leading-5">
              {item.ai.aiSummary ?? "No AI summary generated yet."}
            </dd>
          </div>
        </dl>
      ) : null}
    </article>
  );
}

function groupItems(items: ContentListItem[]) {
  const groups = new Map<string, ContentListItem[]>();

  for (const item of items) {
    const group = item.group?.trim() || "Uncategorized";
    groups.set(group, [...(groups.get(group) ?? []), item]);
  }

  return Array.from(groups, ([name, groupItems]) => ({
    name,
    items: groupItems,
  })).sort((left, right) => {
    if (left.name === "Uncategorized") {
      return 1;
    }

    if (right.name === "Uncategorized") {
      return -1;
    }

    return left.name.localeCompare(right.name);
  });
}
