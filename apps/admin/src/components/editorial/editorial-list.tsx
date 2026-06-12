"use client";

import {
  Archive,
  Briefcase,
  CodeIcon,
  FileText,
  Copy,
  Eye,
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
import { formatDate } from "@/lib/format";

export interface EditorialListItem {
  id: string;
  title: string;
  eyebrow: string;
  status: string;
  dateLabel: string;
  updatedLabel: string;
  summary: string;
  chips: string[];
  metadata: string[];
  aiQualityScore: number | null;
  aiSummary: string | null;
  aiReviewedAt: Date | null;
  aiReviewStatus: string;
  aiReviewError: string | null;
  editHref: string;
  previewHref: string;
}

interface EditorialListProps {
  items: EditorialListItem[];
  title: string;
  listPath: string;
  emptyTitle: string;
  emptyDescription: string;
  runAllLabel: string;
  runAllReviewAction: FormAction;
  canRunAiReview: boolean;
  aiReviewDisabledReason: string | null;
  publishAction: FormAction;
  unpublishAction: FormAction;
  archiveAction: FormAction;
  duplicateAction: FormAction;
  deleteAction: FormAction;
  contentType: "project" | "experience" | "case_study";
}

type StatusFilter = "all" | "draft" | "published" | "archived";

const filters: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];
const contentIcons: Record<EditorialListProps["contentType"], React.ReactNode> = {
  project: (< CodeIcon className="size-4" />),
  experience: (< Briefcase className="size-4" />),
  case_study: (< FileText className="size-4" />) ,
};
export function EditorialList({
  items,
  title,
  listPath,
  emptyTitle,
  emptyDescription,
  runAllLabel,
  runAllReviewAction,
  canRunAiReview,
  aiReviewDisabledReason,
  publishAction,
  unpublishAction,
  archiveAction,
  duplicateAction,
  deleteAction,
  contentType
}: EditorialListProps) {
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
        item.eyebrow,
        item.summary,
        ...item.chips,
        ...item.metadata,
      ].some((value) => value.toLowerCase().includes(needle));
    });
  }, [items, query, statusFilter]);

  if (items.length === 0) {
    return <EmptyPanel title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="ui-section-title">{title}</h2>
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
                `${missingAiReviews} item${missingAiReviews === 1 ? "" : "s"} without AI review.`}
          </p>
        </div>
        <form action={runAllReviewAction} className="flex flex-col items-end gap-1.5">
          <BulkReviewButton
            label={runAllLabel}
            disabled={items.length === 0 || runnableAiReviews === 0 || !canRunAiReview}
          />
          {aiReviewDisabledReason ? (
            <p className="max-w-xs text-right text-xs leading-5 text-muted">
              {aiReviewDisabledReason}
            </p>
          ) : runnableAiReviews === 0 ? (
            <p className="max-w-xs text-right text-xs leading-5 text-muted">
              Every item already has an active AI review.
            </p>
          ) : null}
        </form>
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
            placeholder="Search title, summary, tags..."
            aria-label="Search content"
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
          No records match the current filters.
        </div>
      ) : (
        <ol className="relative grid gap-5 before:absolute before:bottom-3 before:left-4 before:top-3 before:w-px before:bg-line">
          {filtered.map((item) => (
            <EditorialCard
              key={item.id}
              item={item}
              listPath={listPath}
              publishAction={publishAction}
              unpublishAction={unpublishAction}
              archiveAction={archiveAction}
              duplicateAction={duplicateAction}
              deleteAction={deleteAction}
              contentType={contentType}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

function BulkReviewButton({ label, disabled }: { label: string; disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="ui-btn-primary" disabled={disabled || pending}>
      <Sparkles className="size-4" aria-hidden />
      {pending ? "Queuing..." : label}
    </button>
  );
}

function EditorialCard({
  item,
  listPath,
  publishAction,
  unpublishAction,
  archiveAction,
  duplicateAction,
  deleteAction,
  contentType,
}: {
  item: EditorialListItem;
  listPath: string;
  publishAction: FormAction;
  unpublishAction: FormAction;
  archiveAction: FormAction;
  duplicateAction: FormAction;
  deleteAction: FormAction;
  contentType: "project" | "experience" | "case_study";
}) {
  return (
    <li className="relative pl-10">
      <span
        aria-hidden
        className="absolute left-0 top-6 z-10 flex size-8 items-center justify-center rounded-full border border-sky-300/60 bg-sky-400/15 text-sky-200 shadow-[0_0_0_5px_rgba(96,165,250,0.12)]"
      >
        {contentIcons[contentType]}
      </span>
      <article className="ui-card ui-card-hover rounded-lg p-5 shadow-card">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted">
              {item.dateLabel ? <span>{item.dateLabel}</span> : null}
              <StatusBadge status={item.status} />
              <span>{item.updatedLabel}</span>
            </div>
            <p className="ui-eyebrow">{item.eyebrow}</p>
            <h3 className="mt-2 text-xl font-semibold leading-7 text-ink">{item.title}</h3>
            {item.summary ? (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">{item.summary}</p>
            ) : (
              <p className="mt-3 text-sm leading-6 text-muted">No summary added yet.</p>
            )}
            {item.chips.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {item.chips.slice(0, 8).map((chip) => (
                  <li key={chip} className="ui-chip">
                    {chip}
                  </li>
                ))}
              </ul>
            ) : null}
            {item.metadata.length > 0 ? (
              <dl className="mt-4 flex flex-wrap gap-2">
                {item.metadata.map((meta) => (
                  <div key={meta} className="rounded-lg border border-line bg-white/[0.02] px-3 py-1.5">
                    <dt className="sr-only">Metadata</dt>
                    <dd className="text-xs text-muted">{meta}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <AiReviewMeta item={item} />
          </div>

          <div className="flex flex-wrap items-start gap-2 lg:w-48 lg:flex-col">
            <Link href={item.editHref} className="ui-btn-outline w-full justify-center">
              <Pencil className="size-4" aria-hidden />
              Edit
            </Link>
            <Link href={item.previewHref} className="ui-btn-outline w-full justify-center">
              <Eye className="size-4" aria-hidden />
              Preview
            </Link>
            {item.status === "published" ? (
              <ActionForm
                action={unpublishAction}
                id={item.id}
                redirectTo={listPath}
                label="Unpublish"
                pendingLabel="Unpublishing..."
                icon={Undo2}
              />
            ) : (
              <ActionForm
                action={publishAction}
                id={item.id}
                redirectTo={item.editHref}
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
                redirectTo={item.editHref}
                label="Archive"
                pendingLabel="Archiving..."
                icon={Archive}
              />
            ) : null}
            <ActionForm
              action={duplicateAction}
              id={item.id}
              redirectTo={item.editHref}
              label="Duplicate"
              pendingLabel="Duplicating..."
              icon={Copy}
            />
            <ConfirmedForm
              action={deleteAction}
              confirm="always"
              confirmation={{
                title: "Delete this record?",
                description:
                  "This permanently removes the record and its relationships. This cannot be undone.",
                confirmLabel: "Delete record",
                cancelLabel: "Cancel",
                tone: "danger",
              }}
              className="w-full"
            >
              <input type="hidden" name="id" value={item.id} />
              <ActionButton label="Delete" pendingLabel="Deleting..." icon={Trash2} variant="danger" />
            </ConfirmedForm>
          </div>
        </div>
      </article>
    </li>
  );
}

function AiReviewMeta({ item }: { item: EditorialListItem }) {
  return (
    <div className="mt-4 rounded-lg border border-line bg-white/[0.018] p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="ui-eyebrow">AI metadata</p>
        <AiReviewStatusBadge status={item.aiReviewStatus} />
      </div>
      <dl className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
        <div>
          <dt className="sr-only">Score</dt>
          <dd className="ui-chip tabular-nums">
            Score {item.aiQualityScore === null ? "-" : `${item.aiQualityScore}/100`}
          </dd>
        </div>
        <div>
          <dt className="sr-only">Last reviewed</dt>
          <dd className="ui-chip">
            {item.aiReviewedAt ? `Reviewed ${formatDate(item.aiReviewedAt)}` : "Not reviewed"}
          </dd>
        </div>
        <div>
          <dt className="sr-only">Review link</dt>
          <dd>
            <Link href={`${item.editHref}#ai-review`} className="ui-chip transition hover:text-ink">
              View AI Review
            </Link>
          </dd>
        </div>
      </dl>
      <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted">
        {item.aiSummary ?? "No AI summary generated yet."}
      </p>
      {item.aiReviewError ? (
        <p className="mt-2 line-clamp-2 rounded-md border border-danger-300/30 bg-danger-500/10 px-2 py-1 text-xs leading-5 text-danger-100">
          {item.aiReviewError}
        </p>
      ) : null}
    </div>
  );
}

function ActionForm({
  action,
  id,
  redirectTo,
  label,
  pendingLabel,
  icon,
  variant = "secondary",
}: {
  action: FormAction;
  id: string;
  redirectTo: string;
  label: string;
  pendingLabel: string;
  icon: LucideIcon;
  variant?: "primary" | "secondary";
}) {
  return (
    <form action={action} className="w-full">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <ActionButton label={label} pendingLabel={pendingLabel} icon={icon} variant={variant} />
    </form>
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
      ? "ui-btn-primary w-full justify-center"
      : variant === "danger"
        ? "ui-btn-danger w-full justify-center"
        : "ui-btn-secondary w-full justify-center";

  return (
    <button type="submit" className={className} disabled={pending}>
      <Icon className="size-4" aria-hidden />
      {pending ? pendingLabel : label}
    </button>
  );
}
