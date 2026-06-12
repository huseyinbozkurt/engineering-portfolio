import { and, asc, desc, eq, inArray, lt, sql, type InferSelectModel } from "drizzle-orm";

import { getDb } from "./client";
import {
  DEFAULT_STUCK_TASK_TIMEOUT_MS,
  LLM_TASK_CLAIM_LOCK_KEY,
  STUCK_TASK_ERROR_MESSAGE,
} from "./llm-task-scheduling";
import { logLlmTaskEvent } from "./llm-task-log";
import { llmTasks, type LlmTaskStatus } from "./schema";

export type LlmTaskRecord = InferSelectModel<typeof llmTasks>;

export interface CreateLlmTaskInput {
  taskType: string;
  targetType?: string | null;
  targetId?: string | null;
  title: string;
  status?: LlmTaskStatus;
  providerName?: string | null;
  providerModel?: string | null;
  promptSystem: string;
  promptUser: string;
  startedAt?: Date | null;
}

export interface UpdateLlmTaskInput {
  status?: LlmTaskStatus;
  providerName?: string | null;
  providerModel?: string | null;
  rawResponse?: string | null;
  parsedResponse?: unknown;
  finishReason?: string | null;
  errorStage?: string | null;
  errorMessage?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  durationMs?: number | null;
}

export async function createLlmTask(input: CreateLlmTaskInput): Promise<LlmTaskRecord> {
  const [record] = await getDb()
    .insert(llmTasks)
    .values({
      taskType: input.taskType,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      title: input.title,
      status: input.status ?? "pending",
      providerName: input.providerName ?? null,
      providerModel: input.providerModel ?? null,
      promptSystem: input.promptSystem,
      promptUser: input.promptUser,
      startedAt: input.startedAt ?? null,
    })
    .returning();

  if (!record) {
    throw new Error("LLM task insert did not return a record.");
  }

  logLlmTaskEvent("created", record);
  return record;
}

export async function getNextPendingLlmTask(): Promise<LlmTaskRecord | null> {
  const [record] = await getDb()
    .select()
    .from(llmTasks)
    .where(eq(llmTasks.status, "pending"))
    .orderBy(asc(llmTasks.createdAt))
    .limit(1);

  return record ?? null;
}

/**
 * Atomically claim the oldest queued LLM task, enforcing a global limit of one
 * running task at a time. A transaction-scoped advisory lock serialises every
 * claimer so the "is anything already running?" check is race-safe; the pending
 * row is additionally locked with `FOR UPDATE SKIP LOCKED`. Returns null when a
 * task is already running (callers should wait) or the queue is empty.
 */
export async function claimNextPendingLlmTask(): Promise<LlmTaskRecord | null> {
  return getDb().transaction(async (tx) => {
    // Serialise claimers globally; released automatically at transaction end.
    await tx.execute(sql`select pg_advisory_xact_lock(${LLM_TASK_CLAIM_LOCK_KEY})`);

    const [running] = await tx
      .select({ id: llmTasks.id })
      .from(llmTasks)
      .where(eq(llmTasks.status, "running"))
      .limit(1);

    if (running) {
      // Global single concurrency: something is already processing.
      return null;
    }

    const [pending] = await tx
      .select()
      .from(llmTasks)
      .where(eq(llmTasks.status, "pending"))
      .orderBy(asc(llmTasks.createdAt))
      .limit(1)
      .for("update", { skipLocked: true });

    if (!pending) {
      return null;
    }

    const [record] = await tx
      .update(llmTasks)
      .set({
        status: "running",
        startedAt: new Date(),
        attempts: sql`${llmTasks.attempts} + 1`,
        errorStage: null,
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where(and(eq(llmTasks.id, pending.id), eq(llmTasks.status, "pending")))
      .returning();

    if (record) {
      logLlmTaskEvent("claimed", record);
    }

    return record ?? null;
  });
}

/**
 * Recover tasks that are still `running` past the timeout — the worker crashed
 * or the task hung. They are marked `failed` so the single concurrency slot is
 * freed (otherwise the queue would deadlock) and the record can be re-queued.
 * Returns the recovered tasks so callers can reset content review status.
 */
export async function recoverStuckLlmTasks(
  options: { timeoutMs?: number; now?: Date } = {},
): Promise<LlmTaskRecord[]> {
  const now = options.now ?? new Date();
  const timeoutMs = options.timeoutMs ?? DEFAULT_STUCK_TASK_TIMEOUT_MS;
  const cutoff = new Date(now.getTime() - timeoutMs);

  const recovered = await getDb()
    .update(llmTasks)
    .set({
      status: "failed",
      errorStage: "timeout",
      errorMessage: STUCK_TASK_ERROR_MESSAGE,
      completedAt: now,
      updatedAt: now,
    })
    .where(and(eq(llmTasks.status, "running"), lt(llmTasks.startedAt, cutoff)))
    .returning();

  for (const task of recovered) {
    logLlmTaskEvent("recovered", task);
  }

  return recovered;
}

export async function updateLlmTask(
  id: string,
  input: UpdateLlmTaskInput,
): Promise<LlmTaskRecord> {
  const values: Partial<typeof llmTasks.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.status !== undefined) values.status = input.status;
  if (input.providerName !== undefined) values.providerName = input.providerName;
  if (input.providerModel !== undefined) values.providerModel = input.providerModel;
  if (input.rawResponse !== undefined) values.rawResponse = input.rawResponse;
  if (input.parsedResponse !== undefined) values.parsedResponse = input.parsedResponse;
  if (input.finishReason !== undefined) values.finishReason = input.finishReason;
  if (input.errorStage !== undefined) values.errorStage = input.errorStage;
  if (input.errorMessage !== undefined) values.errorMessage = input.errorMessage;
  if (input.startedAt !== undefined) values.startedAt = input.startedAt;
  if (input.completedAt !== undefined) values.completedAt = input.completedAt;
  if (input.durationMs !== undefined) values.durationMs = input.durationMs;

  const [record] = await getDb()
    .update(llmTasks)
    .set(values)
    .where(eq(llmTasks.id, id))
    .returning();

  if (!record) {
    throw new Error("LLM task update did not return a record.");
  }

  return record;
}

export async function getLlmTasks(): Promise<LlmTaskRecord[]> {
  return getDb().select().from(llmTasks).orderBy(desc(llmTasks.createdAt));
}

export async function getActiveLlmTask(taskType: string): Promise<LlmTaskRecord | null> {
  const [record] = await getDb()
    .select()
    .from(llmTasks)
    .where(and(eq(llmTasks.taskType, taskType), inArray(llmTasks.status, ["pending", "running"])))
    .orderBy(desc(llmTasks.createdAt))
    .limit(1);

  return record ?? null;
}

export async function getActiveLlmTaskForTarget(
  taskType: string,
  targetId: string,
): Promise<LlmTaskRecord | null> {
  const [record] = await getDb()
    .select()
    .from(llmTasks)
    .where(
      and(
        eq(llmTasks.taskType, taskType),
        eq(llmTasks.targetId, targetId),
        inArray(llmTasks.status, ["pending", "running"]),
      ),
    )
    .orderBy(desc(llmTasks.createdAt))
    .limit(1);

  return record ?? null;
}

export async function getLatestSucceededLlmTask(
  taskType: string,
): Promise<LlmTaskRecord | null> {
  const [record] = await getDb()
    .select()
    .from(llmTasks)
    .where(and(eq(llmTasks.taskType, taskType), eq(llmTasks.status, "succeeded")))
    .orderBy(desc(llmTasks.completedAt), desc(llmTasks.createdAt))
    .limit(1);

  return record ?? null;
}

export async function getLlmTask(id: string): Promise<LlmTaskRecord | null> {
  const [record] = await getDb().select().from(llmTasks).where(eq(llmTasks.id, id)).limit(1);

  return record ?? null;
}
