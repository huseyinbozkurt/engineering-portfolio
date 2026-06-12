import { describe, expect, it } from "vitest";

import {
  DEFAULT_STUCK_TASK_TIMEOUT_MS,
  decideClaim,
  describeBulkEnqueue,
  findStuckTaskIds,
} from "../src/llm-task-scheduling";

const pending = [
  { id: "b", createdAt: new Date("2026-01-02T00:00:00Z") },
  { id: "a", createdAt: new Date("2026-01-01T00:00:00Z") },
  { id: "c", createdAt: new Date("2026-01-03T00:00:00Z") },
];

describe("decideClaim", () => {
  it("does not claim while a task is already running (global single concurrency)", () => {
    expect(decideClaim({ runningCount: 1, pending })).toBeNull();
  });

  it("claims the oldest queued task when nothing is running (sequential FIFO)", () => {
    expect(decideClaim({ runningCount: 0, pending })).toBe("a");
  });

  it("returns null when the queue is empty", () => {
    expect(decideClaim({ runningCount: 0, pending: [] })).toBeNull();
  });
});

describe("findStuckTaskIds", () => {
  const now = new Date("2026-01-01T01:00:00Z");

  it("flags running tasks started before the timeout, ignoring recent and never-started ones", () => {
    const stuckStart = new Date(now.getTime() - DEFAULT_STUCK_TASK_TIMEOUT_MS - 1_000);
    const recentStart = new Date(now.getTime() - 1_000);

    const ids = findStuckTaskIds(
      [
        { id: "stuck", startedAt: stuckStart },
        { id: "recent", startedAt: recentStart },
        { id: "never-started", startedAt: null },
      ],
      { now },
    );

    expect(ids).toEqual(["stuck"]);
  });

  it("respects a custom timeout", () => {
    const startedAt = new Date(now.getTime() - 5_000);
    expect(findStuckTaskIds([{ id: "x", startedAt }], { now, timeoutMs: 1_000 })).toEqual(["x"]);
    expect(findStuckTaskIds([{ id: "x", startedAt }], { now, timeoutMs: 10_000 })).toEqual([]);
  });
});

describe("describeBulkEnqueue", () => {
  it("summarizes queued and skipped counts", () => {
    expect(describeBulkEnqueue({ queued: 7, skipped: 2 })).toBe(
      "Queued 7 AI review updates. Skipped 2 already processing.",
    );
  });

  it("handles a single queued review with no skips", () => {
    expect(describeBulkEnqueue({ queued: 1, skipped: 0 })).toBe("Queued 1 AI review update.");
  });

  it("messages when nothing needs an update", () => {
    expect(describeBulkEnqueue({ queued: 0, skipped: 0 })).toBe(
      "No records need an AI review update.",
    );
  });
});
