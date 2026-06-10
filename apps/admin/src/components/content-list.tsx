"use client";

import { Pencil, Search } from "lucide-react";
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
  /** Optional extra table columns (label used for the header, value per row). */
  attributes?: Array<{ label: string; value: string }> | undefined;
}

interface ContentListProps<TGroup = unknown> {
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  items: ContentListItem[];
  /** Header label for the primary (name) column. */
  primaryLabel?: string;
  /**
   * Optional client component rendered in each group header (e.g. a per-category
   * editor), with its serializable payload looked up by group name. Passing a
   * component reference + plain data — rather than pre-rendered nodes — keeps
   * this valid across the server/client boundary without React key warnings.
   */
  groupActionComponent?: ComponentType<{ groupName: string; data: TGroup }>;
  groupActionData?: Record<string, TGroup>;
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "published":
      return "ui-badge ui-badge-success";
    case "archived":
      return "ui-badge ui-badge-warning";
    default:
      return "ui-badge ui-badge-neutral";
  }
}

function formatReviewDate(value: Date): string {
  return value.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Filterable data table of content records. The toolbar (free-text + status +
 * group facets, all derived from the items) narrows the rows client-side, so
 * every content area becomes searchable without changing the server pages that
 * render it. Optional `attributes` add extra columns; grouped items render as
 * sectioned tables that share one column template.
 */
export function ContentList<TGroup = unknown>({
  title,
  emptyTitle,
  emptyDescription,
  items,
  primaryLabel = "Name",
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

  // Column shape, derived once from the data so the header and every row align.
  const attrLabels = useMemo(() => {
    const sample = items.find((item) => item.attributes && item.attributes.length > 0);
    return sample?.attributes?.map((attribute) => attribute.label) ?? [];
  }, [items]);
  const hasStatus = items.some((item) => item.status);
  const hasAction = items.some((item) => item.editHref);

  const gridTemplate = [
    "minmax(0,1.7fr)",
    ...attrLabels.map(() => "minmax(0,1fr)"),
    hasStatus ? "minmax(6.5rem,auto)" : null,
    hasAction ? "2.5rem" : null,
  ]
    .filter(Boolean)
    .join(" ");
  const minWidth = `${30 + attrLabels.length * 11 + (hasStatus ? 7 : 0)}rem`;
  const columns = { gridTemplate, minWidth, attrLabels, hasStatus, hasAction, primaryLabel };

  const hasGroups = filtered.some((item) => item.group);
  const groupedItems = hasGroups ? groupItems(filtered) : [];

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="ui-section-title">{title}</h2>
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
          <div className="ui-toolbar mb-4">
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
            <div className="rounded-2xl border border-dashed border-line bg-white/[0.02] p-10 text-center text-sm text-muted">
              No records match the current filters.
            </div>
          ) : hasGroups ? (
            <div className="grid gap-4">
              {groupedItems.map((group) => {
                const groupData = groupActionData?.[group.name];

                return (
                  <div key={group.name} className="ui-card overflow-hidden shadow-card">
                    <div className="flex items-center justify-between gap-3 border-b border-line bg-white/[0.02] px-4 py-3">
                      <h3 className="text-sm font-semibold text-ink">{group.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="ui-chip tabular-nums">{group.items.length}</span>
                        {GroupAction && groupData !== undefined ? (
                          <GroupAction groupName={group.name} data={groupData} />
                        ) : null}
                      </div>
                    </div>
                    <ContentTable items={group.items} columns={columns} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="ui-card overflow-hidden shadow-card">
              <ContentTable items={filtered} columns={columns} />
            </div>
          )}
        </>
      )}
    </section>
  );
}

interface TableColumns {
  gridTemplate: string;
  minWidth: string;
  attrLabels: string[];
  hasStatus: boolean;
  hasAction: boolean;
  primaryLabel: string;
}

function ContentTable({ items, columns }: { items: ContentListItem[]; columns: TableColumns }) {
  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: columns.minWidth }}>
        <div
          className="ui-table-head grid items-center gap-x-4 border-b border-line bg-white/[0.015] px-4 py-2.5"
          style={{ gridTemplateColumns: columns.gridTemplate }}
          role="row"
        >
          <span>{columns.primaryLabel}</span>
          {columns.attrLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
          {columns.hasStatus ? <span>Status</span> : null}
          {columns.hasAction ? <span className="sr-only">Actions</span> : null}
        </div>
        <div className="divide-y divide-line">
          {items.map((item) => (
            <ContentRow key={item.id} item={item} columns={columns} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ContentRow({ item, columns }: { item: ContentListItem; columns: TableColumns }) {
  const rowInner = (
    <div
      className="grid items-center gap-x-4 px-4 py-3.5"
      style={{ gridTemplateColumns: columns.gridTemplate }}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-ink">{item.title}</h3>
          {item.meta ? (
            <span className="rounded-md border border-line bg-white/[0.03] px-1.5 py-0.5 text-[11px] text-muted">
              {item.meta}
            </span>
          ) : null}
        </div>
        {item.description?.trim() ? (
          <p className="mt-0.5 line-clamp-1 text-xs leading-5 text-muted">{item.description}</p>
        ) : null}
      </div>
      {(item.attributes ?? columns.attrLabels.map((label) => ({ label, value: "" }))).map(
        (attribute, index) => (
          <div key={attribute.label || index} className="min-w-0 text-sm text-muted">
            <span className="truncate">{attribute.value || "—"}</span>
          </div>
        ),
      )}
      {columns.hasStatus ? (
        <div>
          {item.status ? (
            <span className={`${statusBadgeClass(item.status)} capitalize`}>{item.status}</span>
          ) : null}
        </div>
      ) : null}
      {columns.hasAction ? (
        <div className="flex items-center justify-end">
          {item.editHref ? (
            <span className="flex size-8 items-center justify-center rounded-lg border border-line bg-white/[0.03] text-muted transition group-hover:border-accent-400/40 group-hover:text-ink">
              <Pencil aria-hidden className="size-3.5" />
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  return (
    <article className="ui-row bg-white/[0.005]">
      {item.editHref ? (
        <Link href={item.editHref} className="group block">
          {rowInner}
        </Link>
      ) : (
        rowInner
      )}
      {item.ai ? (
        <dl className="mx-4 mb-3.5 grid gap-1 rounded-xl border border-line bg-white/[0.02] p-3 text-xs text-muted">
          <p className="ui-eyebrow">AI metadata · read-only</p>
          <div className="flex items-center justify-between gap-3">
            <dt className="font-medium text-ink/80">Quality score</dt>
            <dd className="tabular-nums">{item.ai.contentQualityScore ?? "—"}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="font-medium text-ink/80">Last AI review</dt>
            <dd>
              {item.ai.lastAiReviewAt ? formatReviewDate(item.ai.lastAiReviewAt) : "Not yet reviewed"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink/80">AI summary</dt>
            <dd className="mt-1 leading-5">{item.ai.aiSummary ?? "No AI summary generated yet."}</dd>
          </div>
        </dl>
      ) : null}
    </article>
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
