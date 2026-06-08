"use client";

import { ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ComponentType } from "react";

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

interface ContentListProps<TGroup = unknown> {
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  items: ContentListItem[];
  /**
   * Optional client component rendered in each group header (e.g. a per-category
   * editor), with its serializable payload looked up by group name. Passing a
   * component reference + plain data — rather than pre-rendered nodes — keeps
   * this valid across the server/client boundary without React key warnings.
   */
  groupActionComponent?: ComponentType<{ groupName: string; data: TGroup }>;
  groupActionData?: Record<string, TGroup>;
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

const statusDotClasses: Record<string, string> = {
  published: "bg-teal-300",
  archived: "bg-amber-300",
  draft: "bg-white/40",
};

function formatReviewDate(value: Date): string {
  return value.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Filterable list of content records. The filter bar (free-text + status +
 * group facets, all derived from the items) narrows the list client-side, so
 * every content area becomes searchable without changing the server pages that
 * render it.
 */
export function ContentList<TGroup = unknown>({
  title,
  emptyTitle,
  emptyDescription,
  items,
  groupActionComponent: GroupAction,
  groupActionData,
}: ContentListProps<TGroup>) {
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
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {items.length > 0 ? (
          <span className="ui-chip tabular-nums">
            {filtered.length} of {items.length}
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
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter by name, description…"
                aria-label="Filter list"
                className="ui-input pl-10"
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
            <div className="rounded-2xl border border-dashed border-line bg-white/[0.02] p-8 text-center text-sm text-muted">
              No records match the current filters.
            </div>
          ) : hasGroups ? (
            <div className="grid gap-5">
              {groupedItems.map((group) => {
                const groupData = groupActionData?.[group.name];

                return (
                  <div key={group.name} className="ui-card overflow-hidden">
                    <div className="flex items-center justify-between gap-3 border-b border-line bg-white/[0.02] px-4 py-3">
                      <h3 className="text-sm font-semibold text-ink">{group.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="ui-chip tabular-nums">{group.items.length}</span>
                        {GroupAction && groupData !== undefined ? (
                          <GroupAction groupName={group.name} data={groupData} />
                        ) : null}
                      </div>
                    </div>
                    <div className="divide-y divide-line">
                      {group.items.map((item) => (
                        <ContentListArticle key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="ui-card divide-y divide-line overflow-hidden">
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
      className="ui-select w-auto capitalize"
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
  const header = (
    <div className="flex items-start gap-3">
      {item.status ? (
        <span
          aria-hidden
          className={`mt-1.5 size-2 shrink-0 rounded-full ${statusDotClasses[item.status] ?? statusDotClasses.draft}`}
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
          {item.status ? (
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${statusBadgeClasses(item.status)}`}
            >
              {item.status}
            </span>
          ) : null}
          {item.meta ? <span className="text-xs text-amber-200">{item.meta}</span> : null}
        </div>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">
          {item.description || "Content coming soon."}
        </p>
      </div>
      {item.editHref ? (
        <ChevronRight
          aria-hidden
          className="mt-1 size-4 shrink-0 text-muted/50 transition group-hover:translate-x-0.5 group-hover:text-ink"
        />
      ) : null}
    </div>
  );

  return (
    <article className="bg-white/[0.01] transition hover:bg-white/[0.035]">
      {item.editHref ? (
        <Link href={item.editHref} className="group block px-4 py-3.5">
          {header}
        </Link>
      ) : (
        <div className="px-4 py-3.5">{header}</div>
      )}
      {item.ai ? (
        <dl className="mx-4 mb-3.5 grid gap-1 rounded-xl border border-line bg-white/[0.02] p-3 text-xs text-muted">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted/60">
            AI metadata · read-only
          </p>
          <div className="flex items-center justify-between gap-3">
            <dt className="font-medium text-ink/80">Quality score</dt>
            <dd className="tabular-nums">{item.ai.contentQualityScore ?? "—"}</dd>
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
