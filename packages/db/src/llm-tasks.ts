import { and, desc, eq, inArray, type InferSelectModel } from "drizzle-orm";

import { getDb } from "./client";
import { llmTasks, type LlmTaskStatus } from "./schema";

export type LlmTaskRecord = InferSelectModel<typeof llmTasks>;

export interface CreateLlmTaskInput {
  taskType: string;
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

  return record;
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
