import { and, desc, eq, inArray, type InferSelectModel } from "drizzle-orm";

import { getDb, hasDatabaseUrl } from "./client";
import {
  aiInsightRuns,
  type AiInsightRunAttempt,
  type AiInsightRunStatusValue,
} from "./schema";

export type AiInsightRunRecord = InferSelectModel<typeof aiInsightRuns>;

export interface CreateAiInsightRunInput {
  status?: Extract<AiInsightRunStatusValue, "pending" | "running">;
  provider?: string | null;
  model?: string | null;
  promptVersion: string;
  promptSystem: string;
  promptUser: string;
  inputSnapshot: unknown;
  startedAt?: Date | null;
}

export interface UpdateAiInsightRunInput {
  status?: AiInsightRunStatusValue;
  provider?: string | null;
  model?: string | null;
  rawResponse?: string | null;
  outputJson?: unknown;
  validationNotes?: string[] | null;
  tokenUsage?: AiInsightRunRecord["tokenUsage"];
  attempts?: AiInsightRunAttempt[] | null;
  errorStage?: string | null;
  errorMessage?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  durationMs?: number | null;
  publishedAt?: Date | null;
}

export async function createAiInsightRun(
  input: CreateAiInsightRunInput,
): Promise<AiInsightRunRecord> {
  const [record] = await getDb()
    .insert(aiInsightRuns)
    .values({
      status: input.status ?? "pending",
      provider: input.provider ?? null,
      model: input.model ?? null,
      promptVersion: input.promptVersion,
      promptSystem: input.promptSystem,
      promptUser: input.promptUser,
      inputSnapshot: input.inputSnapshot,
      startedAt: input.startedAt ?? null,
    })
    .returning();

  if (!record) {
    throw new Error("AI insight run insert did not return a record.");
  }

  return record;
}

export async function updateAiInsightRun(
  id: string,
  input: UpdateAiInsightRunInput,
  options: {
    /**
     * Only apply while the run is still pending/running. Terminal writers (the
     * runner, cancellation) pass this so whichever finishes second no-ops
     * instead of clobbering the other's terminal state.
     */
    onlyIfActive?: boolean;
  } = {},
): Promise<AiInsightRunRecord> {
  const values: Partial<typeof aiInsightRuns.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.status !== undefined) values.status = input.status;
  if (input.provider !== undefined) values.provider = input.provider;
  if (input.model !== undefined) values.model = input.model;
  if (input.rawResponse !== undefined) values.rawResponse = input.rawResponse;
  if (input.outputJson !== undefined) values.outputJson = input.outputJson;
  if (input.validationNotes !== undefined) values.validationNotes = input.validationNotes;
  if (input.tokenUsage !== undefined) values.tokenUsage = input.tokenUsage;
  if (input.attempts !== undefined) values.attempts = input.attempts;
  if (input.errorStage !== undefined) values.errorStage = input.errorStage;
  if (input.errorMessage !== undefined) values.errorMessage = input.errorMessage;
  if (input.startedAt !== undefined) values.startedAt = input.startedAt;
  if (input.completedAt !== undefined) values.completedAt = input.completedAt;
  if (input.durationMs !== undefined) values.durationMs = input.durationMs;
  if (input.publishedAt !== undefined) values.publishedAt = input.publishedAt;

  const where = options.onlyIfActive
    ? and(
        eq(aiInsightRuns.id, id),
        inArray(aiInsightRuns.status, ["pending", "running"]),
      )
    : eq(aiInsightRuns.id, id);

  const [record] = await getDb()
    .update(aiInsightRuns)
    .set(values)
    .where(where)
    .returning();

  if (!record) {
    throw new Error(
      options.onlyIfActive
        ? "AI insight run update skipped: the run already reached a terminal state."
        : "AI insight run update did not return a record.",
    );
  }

  return record;
}

// Reads tolerate a missing/unreachable database the same way `queries.ts` does:
// the admin shows an empty list and the public site shows its empty state
// instead of crashing.

export async function getAiInsightRuns(limit = 30): Promise<AiInsightRunRecord[]> {
  if (!hasDatabaseUrl()) {
    return [];
  }

  try {
    return await getDb()
      .select()
      .from(aiInsightRuns)
      .orderBy(desc(aiInsightRuns.createdAt))
      .limit(limit);
  } catch (error) {
    console.error("[db] ai_insight_runs read failed; treating as empty:", error);
    return [];
  }
}

export async function getAiInsightRun(id: string): Promise<AiInsightRunRecord | null> {
  if (!hasDatabaseUrl()) {
    return null;
  }

  try {
    const [record] = await getDb()
      .select()
      .from(aiInsightRuns)
      .where(eq(aiInsightRuns.id, id))
      .limit(1);

    return record ?? null;
  } catch (error) {
    console.error("[db] ai_insight_runs read failed; treating as missing:", error);
    return null;
  }
}

export async function getActiveAiInsightRun(): Promise<AiInsightRunRecord | null> {
  if (!hasDatabaseUrl()) {
    return null;
  }

  try {
    const [record] = await getDb()
      .select()
      .from(aiInsightRuns)
      .where(inArray(aiInsightRuns.status, ["pending", "running"]))
      .orderBy(desc(aiInsightRuns.createdAt))
      .limit(1);

    return record ?? null;
  } catch (error) {
    console.error("[db] ai_insight_runs read failed; treating as missing:", error);
    return null;
  }
}

/** The single published run the public /ai-insights page renders. */
export async function getLatestPublishedAiInsightRun(): Promise<AiInsightRunRecord | null> {
  if (!hasDatabaseUrl()) {
    return null;
  }

  try {
    const [record] = await getDb()
      .select()
      .from(aiInsightRuns)
      .where(eq(aiInsightRuns.status, "published"))
      .orderBy(desc(aiInsightRuns.publishedAt))
      .limit(1);

    console.log("[db] getLatestPublishedAiInsightRun:", record);
    return record ?? null;
  } catch (error) {
    console.error("[db] ai_insight_runs read failed; treating as missing:", error);
    return null;
  }
}

/**
 * Pure publish-transition planner, extracted so the invariant (only succeeded
 * runs become published; the previously published run demotes to succeeded;
 * publishing the published run is a no-op) is unit-testable without a database.
 */
export function planPublishTransition(
  target: { id: string; status: AiInsightRunStatusValue },
  currentPublishedId: string | null,
): { publishId: string | null; demoteId: string | null } {
  if (target.status === "published") {
    return { publishId: null, demoteId: null };
  }

  if (target.status !== "succeeded") {
    throw new Error(
      `Only succeeded runs can be published (run is '${target.status}').`,
    );
  }

  return {
    publishId: target.id,
    demoteId: currentPublishedId && currentPublishedId !== target.id ? currentPublishedId : null,
  };
}

/**
 * Publish a run: demote the currently published run (if any) back to
 * `succeeded`, then promote the target. Runs in a transaction so the
 * single-published partial unique index can never be violated mid-flight.
 */
export async function publishAiInsightRun(id: string): Promise<AiInsightRunRecord> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const [target] = await tx
      .select()
      .from(aiInsightRuns)
      .where(eq(aiInsightRuns.id, id))
      .limit(1);

    if (!target) {
      throw new Error("AI insight run not found.");
    }

    const [currentPublished] = await tx
      .select({ id: aiInsightRuns.id })
      .from(aiInsightRuns)
      .where(eq(aiInsightRuns.status, "published"))
      .limit(1);

    const plan = planPublishTransition(
      { id: target.id, status: target.status },
      currentPublished?.id ?? null,
    );

    if (!plan.publishId) {
      return target;
    }

    if (plan.demoteId) {
      await tx
        .update(aiInsightRuns)
        .set({ status: "succeeded", updatedAt: new Date() })
        .where(eq(aiInsightRuns.id, plan.demoteId));
    }

    const now = new Date();
    const [published] = await tx
      .update(aiInsightRuns)
      .set({ status: "published", publishedAt: now, updatedAt: now })
      .where(eq(aiInsightRuns.id, plan.publishId))
      .returning();

    if (!published) {
      throw new Error("AI insight run publish did not return a record.");
    }

    return published;
  });
}

/** Unpublish: published → succeeded. The public page falls back to its empty state. */
export async function unpublishAiInsightRun(id: string): Promise<AiInsightRunRecord> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const [target] = await tx
      .select()
      .from(aiInsightRuns)
      .where(eq(aiInsightRuns.id, id))
      .limit(1);

    if (!target) {
      throw new Error("AI insight run not found.");
    }

    if (target.status !== "published") {
      return target;
    }

    const [record] = await tx
      .update(aiInsightRuns)
      .set({ status: "succeeded", updatedAt: new Date() })
      .where(eq(aiInsightRuns.id, id))
      .returning();

    if (!record) {
      throw new Error("AI insight run unpublish did not return a record.");
    }

    return record;
  });
}
