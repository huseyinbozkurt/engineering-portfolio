import { and, desc, eq, gte, inArray, lte, type InferSelectModel, type SQL } from "drizzle-orm";

import type { LlmWorkflow } from "@portfolio/validators";

import { getDb, hasDatabaseUrl } from "./client";
import {
  llmRuns,
  llmRunSuggestions,
  type LlmConfigSource,
  type LlmPromptSource,
  type LlmRunAttempt,
  type LlmRunStatusValue,
  type LlmRunSuggestionStatusValue,
} from "./schema";

export type LlmRunRecord = InferSelectModel<typeof llmRuns>;
export type LlmRunSuggestionRecord = InferSelectModel<typeof llmRunSuggestions>;

type TokenUsage = LlmRunRecord["tokenUsage"];

export interface CreateLlmRunInput {
  workflow: LlmWorkflow;
  targetType?: string | null;
  targetId?: string | null;
  status?: Extract<LlmRunStatusValue, "pending" | "running">;
  provider?: string | null;
  model?: string | null;
  visibleModelName?: string | null;
  promptSource: LlmPromptSource;
  promptVersionId?: string | null;
  promptVersion?: string | null;
  promptName?: string | null;
  configSource: LlmConfigSource;
  llmConfigurationId?: string | null;
  temperature?: number | null;
  topP?: number | null;
  maxTokens?: number | null;
  maxRetries?: number | null;
  timeoutMs?: number | null;
  promptSystem: string;
  promptUser: string;
  inputSnapshot?: unknown;
  startedAt?: Date | null;
}

export interface UpdateLlmRunInput {
  status?: LlmRunStatusValue;
  provider?: string | null;
  model?: string | null;
  visibleModelName?: string | null;
  rawResponse?: string | null;
  outputJson?: unknown;
  validationNotes?: string[] | null;
  tokenUsage?: TokenUsage | null;
  attempts?: LlmRunAttempt[] | null;
  errorStage?: string | null;
  errorMessage?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  durationMs?: number | null;
  publishedAt?: Date | null;
  reviewedAt?: Date | null;
}

export interface LlmRunListFilter {
  workflow?: LlmWorkflow;
  status?: LlmRunStatusValue;
  provider?: string;
  promptSource?: LlmPromptSource;
  configSource?: LlmConfigSource;
  targetType?: string;
  targetId?: string;
  /** Inclusive createdAt lower/upper bounds. */
  from?: Date;
  to?: Date;
  limit?: number;
}

export async function createLlmRun(input: CreateLlmRunInput): Promise<LlmRunRecord> {
  const [record] = await getDb()
    .insert(llmRuns)
    .values({
      workflow: input.workflow,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      status: input.status ?? "running",
      provider: input.provider ?? null,
      model: input.model ?? null,
      visibleModelName: input.visibleModelName ?? null,
      promptSource: input.promptSource,
      promptVersionId: input.promptVersionId ?? null,
      promptVersion: input.promptVersion ?? null,
      promptName: input.promptName ?? null,
      configSource: input.configSource,
      llmConfigurationId: input.llmConfigurationId ?? null,
      temperature: input.temperature ?? null,
      topP: input.topP ?? null,
      maxTokens: input.maxTokens ?? null,
      maxRetries: input.maxRetries ?? null,
      timeoutMs: input.timeoutMs ?? null,
      promptSystem: input.promptSystem,
      promptUser: input.promptUser,
      inputSnapshot: input.inputSnapshot ?? null,
      startedAt: input.startedAt ?? null,
    })
    .returning();

  if (!record) {
    throw new Error("LLM run insert did not return a record.");
  }
  return record;
}

export async function updateLlmRun(
  id: string,
  input: UpdateLlmRunInput,
  options: { onlyIfActive?: boolean } = {},
): Promise<LlmRunRecord> {
  const values: Partial<typeof llmRuns.$inferInsert> = { updatedAt: new Date() };

  if (input.status !== undefined) values.status = input.status;
  if (input.provider !== undefined) values.provider = input.provider;
  if (input.model !== undefined) values.model = input.model;
  if (input.visibleModelName !== undefined) values.visibleModelName = input.visibleModelName;
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
  if (input.reviewedAt !== undefined) values.reviewedAt = input.reviewedAt;

  const where = options.onlyIfActive
    ? and(eq(llmRuns.id, id), inArray(llmRuns.status, ["pending", "running"]))
    : eq(llmRuns.id, id);

  const [record] = await getDb().update(llmRuns).set(values).where(where).returning();

  if (!record) {
    throw new Error(
      options.onlyIfActive
        ? "LLM run update skipped: the run already reached a terminal state."
        : "LLM run update did not return a record.",
    );
  }
  return record;
}

export async function getLlmRun(id: string): Promise<LlmRunRecord | null> {
  if (!hasDatabaseUrl()) {
    return null;
  }

  try {
    const [record] = await getDb().select().from(llmRuns).where(eq(llmRuns.id, id)).limit(1);
    return record ?? null;
  } catch (error) {
    console.error("[db] llm_runs read failed; treating as missing:", error);
    return null;
  }
}

export async function getLlmRuns(filter: LlmRunListFilter = {}): Promise<LlmRunRecord[]> {
  if (!hasDatabaseUrl()) {
    return [];
  }

  const conditions: SQL[] = [];
  if (filter.workflow) conditions.push(eq(llmRuns.workflow, filter.workflow));
  if (filter.status) conditions.push(eq(llmRuns.status, filter.status));
  if (filter.provider) conditions.push(eq(llmRuns.provider, filter.provider));
  if (filter.promptSource) conditions.push(eq(llmRuns.promptSource, filter.promptSource));
  if (filter.configSource) conditions.push(eq(llmRuns.configSource, filter.configSource));
  if (filter.targetType) conditions.push(eq(llmRuns.targetType, filter.targetType));
  if (filter.targetId) conditions.push(eq(llmRuns.targetId, filter.targetId));
  if (filter.from) conditions.push(gte(llmRuns.createdAt, filter.from));
  if (filter.to) conditions.push(lte(llmRuns.createdAt, filter.to));

  try {
    return await getDb()
      .select()
      .from(llmRuns)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(llmRuns.createdAt))
      .limit(filter.limit ?? 100);
  } catch (error) {
    console.error("[db] llm_runs list failed; treating as empty:", error);
    return [];
  }
}

/** A run still in flight for a workflow (concurrency guard for single-run workflows). */
export async function getActiveLlmRun(workflow: LlmWorkflow): Promise<LlmRunRecord | null> {
  if (!hasDatabaseUrl()) {
    return null;
  }

  try {
    const [record] = await getDb()
      .select()
      .from(llmRuns)
      .where(and(eq(llmRuns.workflow, workflow), inArray(llmRuns.status, ["pending", "running"])))
      .orderBy(desc(llmRuns.createdAt))
      .limit(1);
    return record ?? null;
  } catch (error) {
    console.error("[db] active llm run read failed; treating as missing:", error);
    return null;
  }
}

/** The single published run for a workflow (e.g. the public AI Insights page). */
export async function getLatestPublishedLlmRun(
  workflow: LlmWorkflow,
): Promise<LlmRunRecord | null> {
  if (!hasDatabaseUrl()) {
    return null;
  }

  try {
    const [record] = await getDb()
      .select()
      .from(llmRuns)
      .where(and(eq(llmRuns.workflow, workflow), eq(llmRuns.status, "published")))
      .orderBy(desc(llmRuns.publishedAt))
      .limit(1);
    return record ?? null;
  } catch (error) {
    console.error("[db] published llm run read failed; treating as missing:", error);
    return null;
  }
}

/**
 * Pure publish-transition planner: only succeeded runs become published; the
 * previously published run for the same workflow demotes to succeeded;
 * publishing the published run is a no-op. Extracted for unit testing.
 */
export function planLlmRunPublishTransition(
  target: { id: string; status: LlmRunStatusValue },
  currentPublishedId: string | null,
): { publishId: string | null; demoteId: string | null } {
  if (target.status === "published") {
    return { publishId: null, demoteId: null };
  }
  if (target.status !== "succeeded") {
    throw new Error(`Only succeeded runs can be published (run is '${target.status}').`);
  }
  return {
    publishId: target.id,
    demoteId: currentPublishedId && currentPublishedId !== target.id ? currentPublishedId : null,
  };
}

export async function publishLlmRun(id: string): Promise<LlmRunRecord> {
  return getDb().transaction(async (tx) => {
    const [target] = await tx.select().from(llmRuns).where(eq(llmRuns.id, id)).limit(1);
    if (!target) {
      throw new Error("LLM run not found.");
    }

    const [currentPublished] = await tx
      .select({ id: llmRuns.id })
      .from(llmRuns)
      .where(and(eq(llmRuns.workflow, target.workflow), eq(llmRuns.status, "published")))
      .limit(1);

    const plan = planLlmRunPublishTransition(
      { id: target.id, status: target.status },
      currentPublished?.id ?? null,
    );

    if (!plan.publishId) {
      return target;
    }

    if (plan.demoteId) {
      await tx
        .update(llmRuns)
        .set({ status: "succeeded", updatedAt: new Date() })
        .where(eq(llmRuns.id, plan.demoteId));
    }

    const now = new Date();
    const [published] = await tx
      .update(llmRuns)
      .set({ status: "published", publishedAt: now, updatedAt: now })
      .where(eq(llmRuns.id, plan.publishId))
      .returning();

    if (!published) {
      throw new Error("LLM run publish did not return a record.");
    }
    return published;
  });
}

export async function unpublishLlmRun(id: string): Promise<LlmRunRecord> {
  const [record] = await getDb()
    .update(llmRuns)
    .set({ status: "succeeded", updatedAt: new Date() })
    .where(and(eq(llmRuns.id, id), eq(llmRuns.status, "published")))
    .returning();

  if (!record) {
    // Already not published — return the current row so callers can no-op.
    const current = await getLlmRun(id);
    if (!current) throw new Error("LLM run not found.");
    return current;
  }
  return record;
}

/** Mark a succeeded run reviewed (used by review-style workflows). */
export async function markLlmRunReviewed(id: string): Promise<LlmRunRecord> {
  const now = new Date();
  const [record] = await getDb()
    .update(llmRuns)
    .set({ status: "reviewed", reviewedAt: now, updatedAt: now })
    .where(eq(llmRuns.id, id))
    .returning();

  if (!record) {
    throw new Error("LLM run review update did not return a record.");
  }
  return record;
}

// ---------------------------------------------------------------------------
// Review-only suggestions. Approving/rejecting records a decision ONLY — it
// never mutates live portfolio data. There is no auto-apply path.
// ---------------------------------------------------------------------------

export interface CreateLlmRunSuggestionInput {
  suggestionType: string;
  targetGroup?: string | null;
  targetRecordType?: string | null;
  targetRecordId?: string | null;
  relationType?: string | null;
  action: string;
  currentValue?: string | null;
  proposedValue?: string | null;
  originalValue?: string | null;
  reason: string;
  confidence?: string | null;
  evidenceRefs?: unknown[];
  affectedRecords?: unknown[];
}

export async function createLlmRunSuggestions(
  runId: string,
  suggestions: CreateLlmRunSuggestionInput[],
): Promise<LlmRunSuggestionRecord[]> {
  if (suggestions.length === 0) {
    return [];
  }

  return getDb()
    .insert(llmRunSuggestions)
    .values(
      suggestions.map((suggestion) => ({
        runId,
        suggestionType: suggestion.suggestionType,
        targetGroup: suggestion.targetGroup ?? null,
        targetRecordType: suggestion.targetRecordType ?? null,
        targetRecordId: suggestion.targetRecordId ?? null,
        relationType: suggestion.relationType ?? null,
        action: suggestion.action,
        currentValue: suggestion.currentValue ?? null,
        proposedValue: suggestion.proposedValue ?? null,
        originalValue: suggestion.originalValue ?? null,
        reason: suggestion.reason,
        confidence: suggestion.confidence ?? null,
        evidenceRefs: suggestion.evidenceRefs ?? [],
        affectedRecords: suggestion.affectedRecords ?? [],
      })),
    )
    .returning();
}

export async function getLlmRunSuggestions(
  filter: { runId?: string; status?: LlmRunSuggestionStatusValue } = {},
): Promise<LlmRunSuggestionRecord[]> {
  if (!hasDatabaseUrl()) {
    return [];
  }

  const conditions: SQL[] = [];
  if (filter.runId) conditions.push(eq(llmRunSuggestions.runId, filter.runId));
  if (filter.status) conditions.push(eq(llmRunSuggestions.status, filter.status));

  try {
    return await getDb()
      .select()
      .from(llmRunSuggestions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(llmRunSuggestions.createdAt));
  } catch (error) {
    console.error("[db] llm_run_suggestions read failed; treating as empty:", error);
    return [];
  }
}

/**
 * Approve or reject a suggestion. This records the reviewer's decision and a
 * timestamp ONLY — it deliberately performs no portfolio mutation.
 */
export async function setLlmRunSuggestionStatus(
  id: string,
  status: Extract<LlmRunSuggestionStatusValue, "approved" | "rejected" | "pending">,
): Promise<LlmRunSuggestionRecord> {
  const [record] = await getDb()
    .update(llmRunSuggestions)
    .set({ status, reviewedAt: status === "pending" ? null : new Date(), updatedAt: new Date() })
    .where(eq(llmRunSuggestions.id, id))
    .returning();

  if (!record) {
    throw new Error("LLM run suggestion update did not return a record.");
  }
  return record;
}
