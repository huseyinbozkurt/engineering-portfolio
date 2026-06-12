import { Sparkles } from "lucide-react";
import Link from "next/link";

import {
  AI_REVIEW_FRESHNESS_LABEL,
  type AiReviewFreshness,
} from "@portfolio/db/ai-review-freshness";

import { updateAllStaleAiReviewsAction, updateRecordAiReviewAction } from "@/app/actions";
import { ClampedText } from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { AiReviewUpdateItem, AiReviewUpdatesModel } from "@/lib/ai-review-updates";

const FRESHNESS_TONE: Record<AiReviewFreshness, string> = {
  not_reviewed: "ui-badge-neutral",
  up_to_date: "ui-badge-success",
  stale: "ui-badge-warning",
  failed: "ui-badge-danger",
  queued: "ui-badge-neutral",
  processing: "ui-badge-accent",
};

export function AiReviewUpdates({ model }: { model: AiReviewUpdatesModel }) {
  const { counts, byType } = model;
  const hasWork = model.items.length > 0;

  return (
    <section className="mt-10" aria-labelledby="ai-review-updates-title">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ui-eyebrow">Admin only</p>
          <h2 id="ai-review-updates-title" className="ui-section-title mt-1">
            AI Review Updates
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
            Records whose content changed after their last AI review, or that were never reviewed.
            Updates are queued and processed one at a time.
          </p>
        </div>
        <form action={updateAllStaleAiReviewsAction}>
          <button type="submit" className="ui-btn-primary" disabled={!hasWork}>
            <Sparkles className="size-4" aria-hidden />
            Update All AI Reviews
          </button>
        </form>
      </div>

      <FreshnessMetrics counts={counts} />

      {hasWork ? (
        <div className="mt-4 grid gap-4">
          {byType.map((group) => (
            <div key={group.type} className="ui-card overflow-hidden shadow-card">
              <div className="flex items-center justify-between gap-3 border-b border-line bg-white/[0.02] px-4 py-3">
                <h3 className="text-sm font-semibold text-ink">{group.label}</h3>
                <span className="ui-chip tabular-nums">{group.items.length}</span>
              </div>
              <ul className="divide-y divide-line">
                {group.items.map((item) => (
                  <ReviewUpdateRow key={item.id} item={item} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-line bg-white/[0.02] p-8">
          <h3 className="text-base font-semibold text-ink">All AI reviews are up to date.</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Every Experience, Project, and Case Study has been reviewed since its last edit. Editing
            a record marks its review stale here.
          </p>
        </div>
      )}
    </section>
  );
}

function ReviewUpdateRow({ item }: { item: AiReviewUpdateItem }) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <FreshnessBadge freshness={item.freshness} />
          {item.score !== null ? (
            <span className="ui-chip tabular-nums">Quality {item.score}</span>
          ) : null}
        </div>
        <ClampedText
          as="h4"
          lines={2}
          title={item.title}
          className="mt-2 text-sm font-semibold text-ink"
        >
          {item.title}
        </ClampedText>
        <p className="mt-1 text-xs leading-5 text-muted">{item.reason}</p>
        <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted/80">
          <div className="flex gap-1">
            <dt className="font-medium text-ink/70">Updated</dt>
            <dd className="tabular-nums">{formatDate(item.updatedAt)}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="font-medium text-ink/70">Last review</dt>
            <dd className="tabular-nums">
              {item.lastAiReviewAt ? formatDate(item.lastAiReviewAt) : "Never"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link href={item.editHref} className="ui-btn-ghost">
          Edit
        </Link>
        <form action={updateRecordAiReviewAction}>
          <input type="hidden" name="contentType" value={item.contentType} />
          <input type="hidden" name="id" value={item.id} />
          <button type="submit" className="ui-btn-outline">
            {item.actionLabel}
          </button>
        </form>
      </div>
    </li>
  );
}

function FreshnessBadge({ freshness }: { freshness: AiReviewFreshness }) {
  return (
    <span className={`ui-badge capitalize ${FRESHNESS_TONE[freshness]}`}>
      {AI_REVIEW_FRESHNESS_LABEL[freshness]}
    </span>
  );
}

function FreshnessMetrics({ counts }: { counts: AiReviewUpdatesModel["counts"] }) {
  const stats: Array<{ label: string; value: number; tone?: string }> = [
    { label: "Not reviewed", value: counts.notReviewed },
    { label: "Stale", value: counts.stale },
    { label: "Failed", value: counts.failed },
    { label: "Queued", value: counts.queued },
    { label: "Processing", value: counts.processing },
    { label: "Up to date", value: counts.upToDate },
  ];

  return (
    <div className="ui-card grid gap-4 p-5 shadow-card sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="sm:border-r sm:border-line sm:pr-6">
        <p className="ui-eyebrow">Records needing review</p>
        <p className="mt-1 text-4xl font-semibold tabular-nums text-ink">{counts.needingReview}</p>
        <p className="mt-1 text-xs text-muted">of {counts.total} total records</p>
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-line bg-white/[0.02] px-3 py-2">
            <dt className="text-xs text-muted">{stat.label}</dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums text-ink">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
