"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

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

/**
 * Filterable list of content records. The filter bar (free-text + status +
 * group facets, all derived from the items) narrows the list client-side, so
 * every content area becomes searchable without changing the server pages that
 * render it.
 */
export function ContentList({ title, emptyTitle, emptyDescription, items }: ContentListProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");

  const statuses = useMemo(
    () => Array.from(new Set(items.map((item) => item.status).filter(Boolean) as string[])).sort(),
    [items],
  );
  const groups = useMemo(
    () =>
      Array.from(
        new Set(items.map((item) => item.group?.trim()).filter(Boolean) as string[]),
      ).sort(),
    [items],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }
      if (groupFilter !== "all" && (item.group?.trim() || "") !== groupFilter) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return [item.title, item.description, item.meta, item.group]
        .filter(Boolean)
        .some((value) => (value as string).toLowerCase().includes(needle));
    });
  }, [items, query, statusFilter, groupFilter]);

  const hasGroups = filtered.some((item) => item.group);
  const groupedItems = hasGroups ? groupItems(filtered) : [];

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {items.length > 0 ? (
          <span className="text-xs text-muted">
            Showing {filtered.length} of {items.length}
          </span>
        ) : null}
      </div>

      {items.length === 0 ? (
        <EmptyPanel title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[14rem] flex-1">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter by name, description…"
                aria-label="Filter list"
                className="w-full rounded-lg border border-line bg-white/[0.04] py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-teal-300/60"
              />
            </div>
            {statuses.length > 1 ? (
              <FilterSelect
                label="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={statuses}
                allLabel="All statuses"
              />
            ) : null}
            {groups.length > 0 ? (
              <FilterSelect
                label="Category"
                value={groupFilter}
                onChange={setGroupFilter}
                options={groups}
                allLabel="All categories"
              />
            ) : null}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line bg-white/[0.02] p-6 text-center text-sm text-muted">
              No records match the current filters.
            </div>
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
              {filtered.map((item) => (
                <ContentListArticle key={item.id} item={item} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  allLabel: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-lg border border-line bg-white/[0.04] px-3 py-2 text-sm capitalize text-ink outline-none transition focus:border-teal-300/60"
    >
      <option value="all">{allLabel}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
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
            Open
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
