import type { AiReviewContentType } from "./content-ai-review";

/**
 * Server-side AI-review freshness. Purely a function of three already-stored
 * fields — the content record's `aiReviewStatus`, its `lastAiReviewAt`, and its
 * `updatedAt`. The LLM is never asked whether a review is stale; staleness is a
 * timestamp comparison.
 *
 * A record is stale when it was edited after its latest completed review
 * (`updatedAt > lastAiReviewAt`), or never reviewed when `lastAiReviewAt` is
 * null. In-flight (`queued`/`processing`) and `failed` states take precedence
 * so the UI reflects the live task before the timestamp comparison.
 */
export type AiReviewFreshness =
  | "not_reviewed"
  | "up_to_date"
  | "stale"
  | "queued"
  | "processing"
  | "failed";

export interface AiReviewFreshnessInput {
  /** Content review status column: idle | queued | processing | completed | failed. */
  aiReviewStatus: string;
  /** When the latest AI review completed; null when never reviewed. */
  lastAiReviewAt: Date | null;
  /** When the content record was last edited. */
  updatedAt: Date;
}

export function computeAiReviewFreshness(input: AiReviewFreshnessInput): AiReviewFreshness {
  if (input.aiReviewStatus === "queued") {
    return "queued";
  }
  if (input.aiReviewStatus === "processing") {
    return "processing";
  }
  if (input.aiReviewStatus === "failed") {
    return "failed";
  }
  if (input.lastAiReviewAt === null) {
    return "not_reviewed";
  }
  if (input.updatedAt.getTime() > input.lastAiReviewAt.getTime()) {
    return "stale";
  }
  return "up_to_date";
}

const NEEDS_REVIEW: ReadonlySet<AiReviewFreshness> = new Set<AiReviewFreshness>([
  "not_reviewed",
  "stale",
  "failed",
]);

/** True for the states that the "Update All" / per-record actions should enqueue. */
export function isNeedsReview(freshness: AiReviewFreshness): boolean {
  return NEEDS_REVIEW.has(freshness);
}

/** Human-readable primary reason, mirrored in the Overview status messaging. */
export function aiReviewFreshnessReason(freshness: AiReviewFreshness): string {
  switch (freshness) {
    case "not_reviewed":
      return "No AI review has been generated yet";
    case "stale":
      return "Content was updated after the last AI review";
    case "failed":
      return "The last AI review attempt failed";
    case "queued":
      return "Waiting for the LLM worker";
    case "processing":
      return "AI review is currently running";
    case "up_to_date":
      return "Reviewed after the last content update";
  }
}

export const AI_REVIEW_FRESHNESS_LABEL: Record<AiReviewFreshness, string> = {
  not_reviewed: "Not reviewed",
  up_to_date: "Up to date",
  stale: "Stale",
  queued: "Queued",
  processing: "Processing",
  failed: "Failed",
};

export interface ReviewFreshnessRecord extends AiReviewFreshnessInput {
  id: string;
  contentType: AiReviewContentType;
}

export interface StaleReviewTarget {
  id: string;
  contentType: AiReviewContentType;
  freshness: AiReviewFreshness;
}

/**
 * The records "Update All AI Reviews" should enqueue: not-reviewed, stale, or
 * failed. Up-to-date records are skipped, and queued/processing records are
 * skipped because a task is already active for them.
 */
export function selectStaleReviewTargets(records: ReviewFreshnessRecord[]): StaleReviewTarget[] {
  const targets: StaleReviewTarget[] = [];

  for (const record of records) {
    const freshness = computeAiReviewFreshness(record);
    if (isNeedsReview(freshness)) {
      targets.push({ id: record.id, contentType: record.contentType, freshness });
    }
  }

  return targets;
}

export interface ReviewFreshnessCounts {
  total: number;
  notReviewed: number;
  upToDate: number;
  stale: number;
  queued: number;
  processing: number;
  failed: number;
  /** not_reviewed + stale + failed — the "Records needing review" headline. */
  needingReview: number;
}

export function summarizeReviewFreshness(records: ReviewFreshnessInputLike[]): ReviewFreshnessCounts {
  const counts: ReviewFreshnessCounts = {
    total: 0,
    notReviewed: 0,
    upToDate: 0,
    stale: 0,
    queued: 0,
    processing: 0,
    failed: 0,
    needingReview: 0,
  };

  for (const record of records) {
    counts.total += 1;
    switch (computeAiReviewFreshness(record)) {
      case "not_reviewed":
        counts.notReviewed += 1;
        break;
      case "up_to_date":
        counts.upToDate += 1;
        break;
      case "stale":
        counts.stale += 1;
        break;
      case "queued":
        counts.queued += 1;
        break;
      case "processing":
        counts.processing += 1;
        break;
      case "failed":
        counts.failed += 1;
        break;
    }
  }

  counts.needingReview = counts.notReviewed + counts.stale + counts.failed;
  return counts;
}

type ReviewFreshnessInputLike = AiReviewFreshnessInput;

/**
 * Pure duplicate-task guard. An AI review must not be enqueued when the record
 * already shows queued/processing, or when an active (pending/running) task is
 * present for the target — both mean a review is already in flight.
 */
export function shouldSkipAiReviewEnqueue(input: {
  aiReviewStatus: string;
  hasActiveTask: boolean;
}): boolean {
  return (
    input.aiReviewStatus === "queued" ||
    input.aiReviewStatus === "processing" ||
    input.hasActiveTask
  );
}
