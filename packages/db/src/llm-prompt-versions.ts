import { and, desc, eq, ne, type InferSelectModel } from "drizzle-orm";

import type {
  CreatePromptVersionInput,
  LlmWorkflow,
  UpdatePromptVersionInput,
} from "@portfolio/validators";

import { getDb, hasDatabaseUrl } from "./client";
import { llmPromptVersions } from "./schema";

export type LlmPromptVersionRecord = InferSelectModel<typeof llmPromptVersions>;

/** Reads tolerate a missing/unreachable DB the same way `queries.ts` does. */
export async function getLlmPromptVersions(
  filter: { workflow?: LlmWorkflow } = {},
): Promise<LlmPromptVersionRecord[]> {
  if (!hasDatabaseUrl()) {
    return [];
  }

  try {
    const where = filter.workflow ? eq(llmPromptVersions.workflow, filter.workflow) : undefined;
    return await getDb()
      .select()
      .from(llmPromptVersions)
      .where(where)
      .orderBy(desc(llmPromptVersions.isActive), desc(llmPromptVersions.updatedAt));
  } catch (error) {
    console.error("[db] llm_prompt_versions read failed; treating as empty:", error);
    return [];
  }
}

export async function getLlmPromptVersion(id: string): Promise<LlmPromptVersionRecord | null> {
  if (!hasDatabaseUrl()) {
    return null;
  }

  try {
    const [record] = await getDb()
      .select()
      .from(llmPromptVersions)
      .where(eq(llmPromptVersions.id, id))
      .limit(1);
    return record ?? null;
  } catch (error) {
    console.error("[db] llm_prompt_versions read failed; treating as missing:", error);
    return null;
  }
}

/**
 * The active prompt version for a workflow — the runtime's first choice. Returns
 * null when none is active, which is the signal to fall back to the hardcoded
 * prompt. Tolerates a missing DB so generation still works on the .env path.
 */
export async function getActivePromptVersion(
  workflow: LlmWorkflow,
): Promise<LlmPromptVersionRecord | null> {
  if (!hasDatabaseUrl()) {
    return null;
  }

  try {
    const [record] = await getDb()
      .select()
      .from(llmPromptVersions)
      .where(and(eq(llmPromptVersions.workflow, workflow), eq(llmPromptVersions.isActive, true)))
      .limit(1);
    return record ?? null;
  } catch (error) {
    console.error("[db] active prompt version read failed; treating as missing:", error);
    return null;
  }
}

export async function createLlmPromptVersion(
  input: CreatePromptVersionInput,
): Promise<LlmPromptVersionRecord> {
  return getDb().transaction(async (tx) => {
    if (input.isActive) {
      // Only one active version per workflow — clear the rest first so the
      // partial unique index can never be violated mid-transaction.
      await tx
        .update(llmPromptVersions)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(llmPromptVersions.workflow, input.workflow));
    }

    const [record] = await tx
      .insert(llmPromptVersions)
      .values({
        workflow: input.workflow,
        version: input.version,
        name: input.name,
        description: input.description ?? null,
        systemPrompt: input.systemPrompt,
        userPromptTemplate: input.userPromptTemplate,
        isActive: input.isActive ?? false,
      })
      .returning();

    if (!record) {
      throw new Error("LLM prompt version insert did not return a record.");
    }
    return record;
  });
}

export async function updateLlmPromptVersion(
  input: UpdatePromptVersionInput,
): Promise<LlmPromptVersionRecord> {
  return getDb().transaction(async (tx) => {
    if (input.isActive) {
      await tx
        .update(llmPromptVersions)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(llmPromptVersions.workflow, input.workflow),
            ne(llmPromptVersions.id, input.id),
          ),
        );
    }

    const [record] = await tx
      .update(llmPromptVersions)
      .set({
        workflow: input.workflow,
        version: input.version,
        name: input.name,
        description: input.description ?? null,
        systemPrompt: input.systemPrompt,
        userPromptTemplate: input.userPromptTemplate,
        isActive: input.isActive ?? false,
        updatedAt: new Date(),
      })
      .where(eq(llmPromptVersions.id, input.id))
      .returning();

    if (!record) {
      throw new Error("LLM prompt version update did not return a record.");
    }
    return record;
  });
}

/**
 * Activate or deactivate a version. Activating one deactivates every other
 * version for the same workflow in the same transaction.
 */
export async function setLlmPromptVersionActive(
  id: string,
  isActive: boolean,
): Promise<LlmPromptVersionRecord> {
  return getDb().transaction(async (tx) => {
    const [target] = await tx
      .select()
      .from(llmPromptVersions)
      .where(eq(llmPromptVersions.id, id))
      .limit(1);

    if (!target) {
      throw new Error("LLM prompt version not found.");
    }

    if (isActive) {
      await tx
        .update(llmPromptVersions)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(llmPromptVersions.workflow, target.workflow), ne(llmPromptVersions.id, id)));
    }

    const [record] = await tx
      .update(llmPromptVersions)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(llmPromptVersions.id, id))
      .returning();

    if (!record) {
      throw new Error("LLM prompt version activation did not return a record.");
    }
    return record;
  });
}

/** Copy a version into a new inactive draft so the original keeps its state. */
export async function duplicateLlmPromptVersion(id: string): Promise<LlmPromptVersionRecord> {
  const source = await getLlmPromptVersion(id);
  if (!source) {
    throw new Error("LLM prompt version not found.");
  }

  const [record] = await getDb()
    .insert(llmPromptVersions)
    .values({
      workflow: source.workflow,
      version: `${source.version}-copy`,
      name: `${source.name} (copy)`,
      description: source.description,
      systemPrompt: source.systemPrompt,
      userPromptTemplate: source.userPromptTemplate,
      isActive: false,
    })
    .returning();

  if (!record) {
    throw new Error("LLM prompt version duplicate did not return a record.");
  }
  return record;
}

export async function deleteLlmPromptVersion(id: string): Promise<void> {
  await getDb().delete(llmPromptVersions).where(eq(llmPromptVersions.id, id));
}
