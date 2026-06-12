"use client";

import {
  Archive,
  Briefcase,
  CalendarDays,
  Copy,
  Eye,
  MapPin,
  Pencil,
  Search,
  Send,
  Sparkles,
  Trash2,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { ConfirmedForm } from "@/components/confirmed-form";
import { EmptyPanel } from "@/components/empty-panel";
import { AiReviewStatusBadge } from "@/components/editorial/ai-review-panel";
import type { FormAction } from "@/components/forms/types";
import { StatusBadge } from "@/components/status-badge";

export interface ExperienceEditorialItem {
  id: string;
  role: string;
  company: string;
  title: string;
  status: string;
  dateRange: string;
  location: string;
  summary: string;
  skills: string[];
  tags: string[];
  metadata: string[];
  updatedLabel: string;
  aiQualityScore: number | null;
  aiSummary: string | null;
  aiReviewedAt: Date | null;
  aiReviewStatus: string;
  aiReviewError: string | null;
  editHref: string;
  previewHref: string;
}

interface ExperienceEditorialListProps {
  items: ExperienceEditorialItem[];
  publishAction: FormAction;
  unpublishAction: FormAction;
  archiveAction: FormAction;
  duplicateAction: FormAction;
  deleteAction: FormAction;
  runAllReviewAction: FormAction;
  canRunAiReview: boolean;
  aiReviewDisabledReason: string | null;
}

type StatusFilter = "all" | "draft" | "published" | "archived";

const filters: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export function ExperienceEditorialList({
  items,
  publishAction,
  unpublishAction,
  archiveAction,
  duplicateAction,
  deleteAction,
  runAllReviewAction,
  canRunAiReview,
  aiReviewDisabledReason,
}: ExperienceEditorialListProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const activeAiReviews = items.filter((item) =>
    ["queued", "processing"].includes(item.aiReviewStatus),
  ).length;
  const runnableAiReviews = items.length - activeAiReviews;
  const missingAiReviews = items.filter((item) => !item.aiReviewedAt).length;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      if (!needle) {
        return true;
      }

      return [
        item.title,
        item.role,
        item.company,
        item.summary,
        item.location,
        ...item.skills,
        ...item.tags,
        ...item.metadata,
      ].some((value) => value.toLowerCase().includes(needle));
    });
  }, [items, query, statusFilter]);

  if (items.length === 0) {
    return (
      <EmptyPanel
        title="No experience drafts yet"
        description="Create a draft to start shaping an experience entry."
      />
    );
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="ui-section-title">Editorial queue</h2>
        <span className="ui-chip tabular-nums">
          {filtered.length} of {items.length}
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-white/[0.02] p-4">
        <div>
          <h3 className="text-sm font-semibold text-ink">AI Review</h3>
          <p className="mt-1 text-xs leading-5 text-muted">
            {activeAiReviews > 0
              ? `${activeAiReviews} review${activeAiReviews === 1 ? "" : "s"} queued or processing.`
              : aiReviewDisabledReason ??
                `${missingAiReviews} experience${missingAiReviews === 1 ? "" : "s"} without AI review.`}
          </p>
        </div>
        <BulkReviewForm
          action={runAllReviewAction}
          disabled={items.length === 0 || runnableAiReviews === 0 || !canRunAiReview}
          disabledReason={
            aiReviewDisabledReason ??
            (runnableAiReviews === 0 && items.length > 0
              ? "Every experience already has an active AI review."
              : null)
          }
        />
      </div>

      <div className="ui-toolbar mb-6">
        <div className="relative min-w-[15rem] flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, role, company..."
            aria-label="Search experience"
            className="ui-input pl-10"
          />
        </div>
        <div className="flex rounded-xl border border-line bg-white/[0.02] p-1" aria-label="Status">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={
                statusFilter === filter.value
                  ? "rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-ink"
                  : "rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition hover:text-ink"
              }
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white/[0.02] p-10 text-center text-sm text-muted">
          No experience records match the current filters.
        </div>
      ) : (
        <ol className="relative grid gap-5 before:absolute before:bottom-3 before:left-4 before:top-3 before:w-px before:bg-line">
          {filtered.map((item) => (
            <ExperienceEditorialCard
              key={item.id}
              item={item}
              publishAction={publishAction}
              unpublishAction={unpublishAction}
              archiveAction={archiveAction}
              duplicateAction={duplicateAction}
              deleteAction={deleteAction}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

function BulkReviewForm({
  action,
  disabled,
  disabledReason,
}: {
  action: FormAction;
  disabled: boolean;
  disabledReason: string | null;
}) {
  return (
    <form action={action} className="flex flex-col items-end gap-1.5">
      <BulkReviewButton disabled={disabled} />
      {disabledReason ? (
        <p className="max-w-xs text-right text-xs leading-5 text-muted">{disabledReason}</p>
      ) : null}
    </form>
  );
}

function BulkReviewButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="ui-btn-primary" disabled={disabled || pending}>
      <Sparkles className="size-4" aria-hidden />
      {pending ? "Queuing..." : "Run AI Review for All"}
    </button>
  );
}

function ExperienceEditorialCard({
  item,
  publishAction,
  unpublishAction,
  archiveAction,
  duplicateAction,
  deleteAction,
}: {
  item: ExperienceEditorialItem;
  publishAction: FormAction;
  unpublishAction: FormAction;
  archiveAction: FormAction;
  duplicateAction: FormAction;
  deleteAction: FormAction;
}) {
  const chipItems = [...item.skills, ...item.tags].slice(0, 8);

  return (
    <li className="relative pl-10">
      <span
        aria-hidden
        className="absolute left-0 top-6 z-10 flex size-8 items-center justify-center rounded-full border border-sky-300/60 bg-sky-400/15 text-sky-200 shadow-[0_0_0_5px_rgba(96,165,250,0.12)]"
      >
        <Briefcase className="size-4" />
      </span>
      <article className="ui-card ui-card-hover rounded-lg p-5 shadow-card">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {item.dateRange ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-200">
                  <CalendarDays className="size-3.5" aria-hidden />
                  {item.dateRange}
                </span>
              ) : null}
              <StatusBadge status={item.status} />
              {item.updatedLabel ? <span className="ui-chip">{item.updatedLabel}</span> : null}
            </div>

            <h3 className="mt-4 text-xl font-semibold leading-7 text-ink">{item.role}</h3>
            <p className="mt-1 text-sm font-medium text-muted">{item.company}</p>

            {item.location ? (
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted">
                <MapPin className="size-3.5" aria-hidden />
                {item.location}
              </p>
            ) : null}

            {item.summary ? (
              <p className="mt-4 max-w-4xl text-sm leading-6 text-muted">{item.summary}</p>
            ) : (
              <p className="mt-4 text-sm italic leading-6 text-muted/70">No summary drafted yet.</p>
            )}

            {chipItems.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {chipItems.map((tag) => (
                  <li
                    key={`${item.id}-${tag}`}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-ink/85"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            ) : null}

            {item.metadata.length > 0 ? (
              <dl className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
                {item.metadata.map((value) => (
                  <div
                    key={`${item.id}-${value}`}
                    className="rounded-lg border border-line bg-white/[0.025] px-2.5 py-1"
                  >
                    <dt className="sr-only">Metadata</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <AiReviewMeta item={item} />
          </div>

          <div className="flex flex-wrap content-start items-center gap-2 lg:max-w-60 lg:justify-end">
            <Link href={item.editHref} className="ui-btn-outline">
              <Pencil className="size-3.5" aria-hidden />
              Edit
            </Link>
            <Link href={item.previewHref} className="ui-btn-outline">
              <Eye className="size-3.5" aria-hidden />
              Preview
            </Link>
            {item.status === "published" ? (
              <ActionForm
                action={unpublishAction}
                id={item.id}
                redirectTo="/content/experiences"
                label="Unpublish"
                pendingLabel="Unpublishing..."
                icon={Undo2}
              />
            ) : (
              <ActionForm
                action={publishAction}
                id={item.id}
                redirectTo="/content/experiences"
                label="Publish"
                pendingLabel="Publishing..."
                icon={Send}
                variant="primary"
              />
            )}
            {item.status !== "archived" ? (
              <ActionForm
                action={archiveAction}
                id={item.id}
                redirectTo="/content/experiences"
                label="Archive"
                pendingLabel="Archiving..."
                icon={Archive}
              />
            ) : null}
            <ActionForm
              action={duplicateAction}
              id={item.id}
              label="Duplicate"
              pendingLabel="Duplicating..."
              icon={Copy}
            />
            <ActionForm
              action={deleteAction}
              id={item.id}
              label="Delete"
              pendingLabel="Deleting..."
              icon={Trash2}
              variant="danger"
              confirmation={{
                title: "Delete this experience?",
                description:
                  "This permanently removes the experience and all of its relationships. This cannot be undone.",
                confirmLabel: "Delete experience",
                cancelLabel: "Cancel",
                tone: "danger",
              }}
            />
          </div>
        </div>
      </article>
    </li>
  );
}

function AiReviewMeta({ item }: { item: ExperienceEditorialItem }) {
  return (
    <section className="mt-4 rounded-lg border border-line bg-white/[0.02] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="ui-eyebrow">AI metadata</p>
        <AiReviewStatusBadge status={item.aiReviewStatus} />
        <span className="ui-chip tabular-nums">
          Score {item.aiQualityScore === null ? "-" : `${item.aiQualityScore}/100`}
        </span>
        <span className="ui-chip">
          {item.aiReviewedAt ? `Reviewed ${formatReviewDate(item.aiReviewedAt)}` : "Not reviewed"}
        </span>
        <Link href={`${item.editHref}#ai-review`} className="ui-chip transition hover:text-ink">
          View AI Review
        </Link>
      </div>
      {item.aiSummary ? (
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">{item.aiSummary}</p>
      ) : (
        <p className="mt-2 text-xs italic leading-5 text-muted/70">No AI summary generated yet.</p>
      )}
      {item.aiReviewError ? (
        <p className="mt-2 line-clamp-2 rounded-md border border-danger-300/30 bg-danger-500/10 px-2 py-1 text-xs leading-5 text-danger-100">
          {item.aiReviewError}
        </p>
      ) : null}
    </section>
  );
}

function formatReviewDate(value: Date): string {
  return value.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ActionForm({
  action,
  id,
  label,
  pendingLabel,
  icon,
  variant = "secondary",
  redirectTo,
  confirmation,
}: {
  action: FormAction;
  id: string;
  label: string;
  pendingLabel: string;
  icon: LucideIcon;
  variant?: "primary" | "secondary" | "danger";
  redirectTo?: string | undefined;
  confirmation?:
    | {
        title: string;
        description: string;
        confirmLabel: string;
        cancelLabel: string;
        tone: "danger";
      }
    | undefined;
}) {
  return (
    <ConfirmedForm
      action={action}
      confirm={confirmation ? "always" : "off"}
      className="contents"
      {...(confirmation ? { confirmation } : {})}
    >
      <input type="hidden" name="id" value={id} />
      {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}
      <ActionButton label={label} pendingLabel={pendingLabel} icon={icon} variant={variant} />
    </ConfirmedForm>
  );
}

function ActionButton({
  label,
  pendingLabel,
  icon: Icon,
  variant,
}: {
  label: string;
  pendingLabel: string;
  icon: LucideIcon;
  variant: "primary" | "secondary" | "danger";
}) {
  const { pending } = useFormStatus();
  const className =
    variant === "primary"
      ? "ui-btn-primary px-3 py-2"
      : variant === "danger"
        ? "ui-btn-danger px-3 py-2"
        : "ui-btn-outline";

  return (
    <button type="submit" className={className} disabled={pending}>
      <Icon className="size-3.5" aria-hidden />
      {pending ? pendingLabel : label}
    </button>
  );
}
