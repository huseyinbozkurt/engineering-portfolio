import { describe, expect, it } from "vitest";

import {
  computeAiReviewFreshness,
  selectStaleReviewTargets,
  shouldSkipAiReviewEnqueue,
  summarizeReviewFreshness,
  type ReviewFreshnessRecord,
} from "../src/ai-review-freshness";

const reviewedAt = new Date("2026-01-01T00:00:00Z");
const earlier = new Date("2025-12-01T00:00:00Z");
const later = new Date("2026-02-01T00:00:00Z");

describe("computeAiReviewFreshness", () => {
  it("is stale when updatedAt > lastAiReviewAt", () => {
    expect(
      computeAiReviewFreshness({
        aiReviewStatus: "completed",
        lastAiReviewAt: reviewedAt,
        updatedAt: later,
      }),
    ).toBe("stale");
  });

  it("is not_reviewed when lastAiReviewAt is null", () => {
    expect(
      computeAiReviewFreshness({ aiReviewStatus: "idle", lastAiReviewAt: null, updatedAt: later }),
    ).toBe("not_reviewed");
  });

  it("is up_to_date when updatedAt <= lastAiReviewAt", () => {
    expect(
      computeAiReviewFreshness({
        aiReviewStatus: "completed",
        lastAiReviewAt: reviewedAt,
        updatedAt: earlier,
      }),
    ).toBe("up_to_date");
  });

  it("treats a just-completed review (updatedAt == lastAiReviewAt) as up_to_date", () => {
    // saveContentAiReviewSuccess stamps both columns with the same `now`, so a
    // freshly reviewed record must read up_to_date until it is edited again.
    expect(
      computeAiReviewFreshness({
        aiReviewStatus: "completed",
        lastAiReviewAt: reviewedAt,
        updatedAt: reviewedAt,
      }),
    ).toBe("up_to_date");
  });

  it("prefers the live task status over the timestamp comparison", () => {
    for (const status of ["queued", "processing", "failed"] as const) {
      expect(
        computeAiReviewFreshness({
          aiReviewStatus: status,
          lastAiReviewAt: earlier,
          updatedAt: later,
        }),
      ).toBe(status);
    }
  });
});

const records: ReviewFreshnessRecord[] = [
  { id: "stale", contentType: "experience", aiReviewStatus: "completed", lastAiReviewAt: reviewedAt, updatedAt: later },
  { id: "new", contentType: "project", aiReviewStatus: "idle", lastAiReviewAt: null, updatedAt: later },
  { id: "failed", contentType: "case_study", aiReviewStatus: "failed", lastAiReviewAt: reviewedAt, updatedAt: earlier },
  { id: "fresh", contentType: "experience", aiReviewStatus: "completed", lastAiReviewAt: reviewedAt, updatedAt: earlier },
  { id: "queued", contentType: "project", aiReviewStatus: "queued", lastAiReviewAt: null, updatedAt: later },
  { id: "processing", contentType: "case_study", aiReviewStatus: "processing", lastAiReviewAt: reviewedAt, updatedAt: later },
];

describe("selectStaleReviewTargets", () => {
  it("selects only not_reviewed, stale, and failed records", () => {
    expect(selectStaleReviewTargets(records).map((target) => target.id)).toEqual([
      "stale",
      "new",
      "failed",
    ]);
  });

  it("skips up_to_date, queued, and processing records", () => {
    const ids = selectStaleReviewTargets(records).map((target) => target.id);
    expect(ids).not.toContain("fresh");
    expect(ids).not.toContain("queued");
    expect(ids).not.toContain("processing");
  });
});

describe("summarizeReviewFreshness", () => {
  it("counts each bucket and needingReview = not_reviewed + stale + failed", () => {
    const counts = summarizeReviewFreshness(records);
    expect(counts).toMatchObject({
      total: 6,
      notReviewed: 1,
      stale: 1,
      failed: 1,
      upToDate: 1,
      queued: 1,
      processing: 1,
      needingReview: 3,
    });
  });
});

describe("shouldSkipAiReviewEnqueue", () => {
  it("skips records already queued or processing", () => {
    expect(shouldSkipAiReviewEnqueue({ aiReviewStatus: "queued", hasActiveTask: false })).toBe(true);
    expect(shouldSkipAiReviewEnqueue({ aiReviewStatus: "processing", hasActiveTask: false })).toBe(
      true,
    );
  });

  it("skips when an active task already exists for the target", () => {
    expect(shouldSkipAiReviewEnqueue({ aiReviewStatus: "completed", hasActiveTask: true })).toBe(
      true,
    );
  });

  it("allows enqueue for idle/failed/completed records with no active task", () => {
    expect(shouldSkipAiReviewEnqueue({ aiReviewStatus: "idle", hasActiveTask: false })).toBe(false);
    expect(shouldSkipAiReviewEnqueue({ aiReviewStatus: "failed", hasActiveTask: false })).toBe(
      false,
    );
  });
});
