import { and, desc, eq, ne, type InferSelectModel } from "drizzle-orm";

import type {
  LlmConfigurationInput,
  LlmWorkflow,
  UpdateLlmConfigurationInput,
} from "@portfolio/validators";

import { getDb, hasDatabaseUrl } from "./client";
import { llmConfigurations } from "./schema";

export type LlmConfigurationRecord = InferSelectModel<typeof llmConfigurations>;

export async function getLlmConfigurations(
  filter: { workflow?: LlmWorkflow } = {},
): Promise<LlmConfigurationRecord[]> {
  if (!hasDatabaseUrl()) {
    return [];
  }

  try {
    const where = filter.workflow ? eq(llmConfigurations.workflow, filter.workflow) : undefined;
    return await getDb()
      .select()
      .from(llmConfigurations)
      .where(where)
      .orderBy(desc(llmConfigurations.isActive), desc(llmConfigurations.updatedAt));
  } catch (error) {
    console.error("[db] llm_configurations read failed; treating as empty:", error);
    return [];
  }
}

export async function getLlmConfiguration(id: string): Promise<LlmConfigurationRecord | null> {
  if (!hasDatabaseUrl()) {
    return null;
  }

  try {
    const [record] = await getDb()
      .select()
      .from(llmConfigurations)
      .where(eq(llmConfigurations.id, id))
      .limit(1);
    return record ?? null;
  } catch (error) {
    console.error("[db] llm_configurations read failed; treating as missing:", error);
    return null;
  }
}

/**
 * The active configuration for a workflow — the runtime's first choice. Returns
 * null when none is active, which is the signal to fall back to .env config.
 */
export async function getActiveLlmConfiguration(
  workflow: LlmWorkflow,
): Promise<LlmConfigurationRecord | null> {
  if (!hasDatabaseUrl()) {
    return null;
  }

  try {
    const [record] = await getDb()
      .select()
      .from(llmConfigurations)
      .where(and(eq(llmConfigurations.workflow, workflow), eq(llmConfigurations.isActive, true)))
      .limit(1);
    return record ?? null;
  } catch (error) {
    console.error("[db] active llm configuration read failed; treating as missing:", error);
    return null;
  }
}

export async function createLlmConfiguration(
  input: LlmConfigurationInput,
): Promise<LlmConfigurationRecord> {
  return getDb().transaction(async (tx) => {
    if (input.isActive) {
      await tx
        .update(llmConfigurations)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(llmConfigurations.workflow, input.workflow));
    }

    const [record] = await tx
      .insert(llmConfigurations)
      .values({
        workflow: input.workflow,
        provider: input.provider,
        model: input.model,
        visibleModelName: input.visibleModelName ?? null,
        baseUrl: input.baseUrl ?? null,
        temperature: input.temperature,
        topP: input.topP,
        maxTokens: input.maxTokens,
        maxRetries: input.maxRetries,
        timeoutMs: input.timeoutMs ?? null,
        isActive: input.isActive ?? false,
      })
      .returning();

    if (!record) {
      throw new Error("LLM configuration insert did not return a record.");
    }
    return record;
  });
}

export async function updateLlmConfiguration(
  input: UpdateLlmConfigurationInput,
): Promise<LlmConfigurationRecord> {
  return getDb().transaction(async (tx) => {
    if (input.isActive) {
      await tx
        .update(llmConfigurations)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(eq(llmConfigurations.workflow, input.workflow), ne(llmConfigurations.id, input.id)),
        );
    }

    const [record] = await tx
      .update(llmConfigurations)
      .set({
        workflow: input.workflow,
        provider: input.provider,
        model: input.model,
        visibleModelName: input.visibleModelName ?? null,
        baseUrl: input.baseUrl ?? null,
        temperature: input.temperature,
        topP: input.topP,
        maxTokens: input.maxTokens,
        maxRetries: input.maxRetries,
        timeoutMs: input.timeoutMs ?? null,
        isActive: input.isActive ?? false,
        updatedAt: new Date(),
      })
      .where(eq(llmConfigurations.id, input.id))
      .returning();

    if (!record) {
      throw new Error("LLM configuration update did not return a record.");
    }
    return record;
  });
}

export async function setLlmConfigurationActive(
  id: string,
  isActive: boolean,
): Promise<LlmConfigurationRecord> {
  return getDb().transaction(async (tx) => {
    const [target] = await tx
      .select()
      .from(llmConfigurations)
      .where(eq(llmConfigurations.id, id))
      .limit(1);

    if (!target) {
      throw new Error("LLM configuration not found.");
    }

    if (isActive) {
      await tx
        .update(llmConfigurations)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(llmConfigurations.workflow, target.workflow), ne(llmConfigurations.id, id)));
    }

    const [record] = await tx
      .update(llmConfigurations)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(llmConfigurations.id, id))
      .returning();

    if (!record) {
      throw new Error("LLM configuration activation did not return a record.");
    }
    return record;
  });
}

export async function duplicateLlmConfiguration(id: string): Promise<LlmConfigurationRecord> {
  const source = await getLlmConfiguration(id);
  if (!source) {
    throw new Error("LLM configuration not found.");
  }

  const [record] = await getDb()
    .insert(llmConfigurations)
    .values({
      workflow: source.workflow,
      provider: source.provider,
      model: source.model,
      visibleModelName: source.visibleModelName,
      baseUrl: source.baseUrl,
      temperature: source.temperature,
      topP: source.topP,
      maxTokens: source.maxTokens,
      maxRetries: source.maxRetries,
      timeoutMs: source.timeoutMs,
      isActive: false,
    })
    .returning();

  if (!record) {
    throw new Error("LLM configuration duplicate did not return a record.");
  }
  return record;
}

export async function deleteLlmConfiguration(id: string): Promise<void> {
  await getDb().delete(llmConfigurations).where(eq(llmConfigurations.id, id));
}
