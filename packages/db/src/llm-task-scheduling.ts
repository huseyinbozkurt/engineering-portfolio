/**
 * Pure scheduling decisions for the LLM task queue, separated from the DB layer
 * so the global-concurrency and stuck-recovery rules can be unit-tested without
 * a database. The transactional wiring in `llm-tasks.ts` applies these.
 */

/** Advisory-lock key serialising all claim attempts so the concurrency check is race-safe. */
export const LLM_TASK_CLAIM_LOCK_KEY = 742_110_001;

/** A claimed/running task older than this is treated as crashed and recovered. */
export const DEFAULT_STUCK_TASK_TIMEOUT_MS = 30 * 60 * 1000;

export const STUCK_TASK_ERROR_MESSAGE = "Task timed out or worker crashed";

export interface ClaimCandidate {
  id: string;
  createdAt: Date;
}

/**
 * Global single-concurrency claim decision. Never claim while any task is
 * already running (max 1 processing at a time, across every content type),
 * otherwise claim the oldest queued task so the worker drains FIFO.
 */
export function decideClaim(input: {
  runningCount: number;
  pending: ClaimCandidate[];
}): string | null {
  if (input.runningCount > 0) {
    return null;
  }
  if (input.pending.length === 0) {
    return null;
  }

  const oldest = input.pending.reduce((earliest, candidate) =>
    candidate.createdAt.getTime() < earliest.createdAt.getTime() ? candidate : earliest,
  );

  return oldest.id;
}

export interface StuckCandidate {
  id: string;
  startedAt: Date | null;
}

/**
 * Ids of running tasks whose `startedAt` is older than the timeout — i.e. the
 * worker crashed or the task hung. Recovering these frees the single concurrency
 * slot so the queue does not deadlock.
 */
export function findStuckTaskIds(
  processing: StuckCandidate[],
  options: { now: Date; timeoutMs?: number },
): string[] {
  const timeoutMs = options.timeoutMs ?? DEFAULT_STUCK_TASK_TIMEOUT_MS;
  const cutoff = options.now.getTime() - timeoutMs;

  return processing
    .filter((task) => task.startedAt !== null && task.startedAt.getTime() < cutoff)
    .map((task) => task.id);
}

export interface BulkEnqueueOutcome {
  queued: number;
  skipped: number;
}

/** "Queued 7 AI review updates. Skipped 2 already processing." */
export function describeBulkEnqueue(outcome: BulkEnqueueOutcome): string {
  if (outcome.queued === 0) {
    return outcome.skipped > 0
      ? `No new AI reviews queued. Skipped ${outcome.skipped} already queued or processing.`
      : "No records need an AI review update.";
  }

  const queuedLabel = `Queued ${outcome.queued} AI review update${outcome.queued === 1 ? "" : "s"}.`;

  if (outcome.skipped === 0) {
    return queuedLabel;
  }

  return `${queuedLabel} Skipped ${outcome.skipped} already processing.`;
}
