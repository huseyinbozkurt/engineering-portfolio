import { and, desc, eq, inArray, type InferSelectModel } from "drizzle-orm";

import type {
  TaxonomyReviewOutput,
  TaxonomySuggestion,
  TaxonomySuggestionStatus,
  TaxonomyTargetGroup,
} from "@portfolio/validators";

import { getDb, hasDatabaseUrl, type PortfolioDb } from "./client";
import { getAdminContentIndex, type AdminContentIndexRecord } from "./queries";
import {
  caseStudyLenses,
  caseStudyPrinciples,
  caseStudySkills,
  caseStudyTags,
  decisionPatternPrinciples,
  experienceLenses,
  experiencePrinciples,
  experienceSkills,
  experienceTags,
  projectLenses,
  projectPrinciples,
  projectSkills,
  projectTags,
  taxonomyReviewRuns,
  taxonomyReviewSuggestions,
  type TaxonomyReviewRunAttempt,
  type TaxonomyReviewRunStatusValue,
} from "./schema";

export type TaxonomyReviewRunRecord = InferSelectModel<typeof taxonomyReviewRuns>;
export type TaxonomyReviewSuggestionRecord = InferSelectModel<
  typeof taxonomyReviewSuggestions
>;

export interface TaxonomyReviewRunWithSuggestions extends TaxonomyReviewRunRecord {
  suggestions: TaxonomyReviewSuggestionRecord[];
}

export interface CreateTaxonomyReviewRunInput {
  status?: Extract<TaxonomyReviewRunStatusValue, "pending" | "running">;
  provider?: string | null;
  model?: string | null;
  promptVersion: string;
  promptSystem: string;
  promptUser: string;
  inputSnapshot: unknown;
  startedAt?: Date | null;
}

export interface UpdateTaxonomyReviewRunInput {
  status?: TaxonomyReviewRunStatusValue;
  provider?: string | null;
  model?: string | null;
  rawResponse?: string | null;
  outputJson?: TaxonomyReviewOutput | null;
  validationNotes?: string[] | null;
  tokenUsage?: TaxonomyReviewRunRecord["tokenUsage"];
  attempts?: TaxonomyReviewRunAttempt[] | null;
  errorStage?: string | null;
  errorMessage?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  durationMs?: number | null;
  generatedAt?: Date | null;
  reviewedAt?: Date | null;
}

export interface TaxonomyRelationPair {
  left: string;
  right: string;
}

export interface TaxonomyReviewSource {
  index: AdminContentIndexRecord;
  relations: {
    experienceLenses: TaxonomyRelationPair[];
    experiencePrinciples: TaxonomyRelationPair[];
    experienceSkills: TaxonomyRelationPair[];
    experienceTags: TaxonomyRelationPair[];
    projectLenses: TaxonomyRelationPair[];
    projectPrinciples: TaxonomyRelationPair[];
    projectSkills: TaxonomyRelationPair[];
    projectTags: TaxonomyRelationPair[];
    caseStudyLenses: TaxonomyRelationPair[];
    caseStudyPrinciples: TaxonomyRelationPair[];
    caseStudySkills: TaxonomyRelationPair[];
    caseStudyTags: TaxonomyRelationPair[];
    decisionPatternPrinciples: TaxonomyRelationPair[];
  };
}

export async function createTaxonomyReviewRun(
  input: CreateTaxonomyReviewRunInput,
): Promise<TaxonomyReviewRunRecord> {
  const [record] = await getDb()
    .insert(taxonomyReviewRuns)
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
    throw new Error("Taxonomy review run insert did not return a record.");
  }

  return record;
}

export async function updateTaxonomyReviewRun(
  id: string,
  input: UpdateTaxonomyReviewRunInput,
  options: { onlyIfActive?: boolean } = {},
): Promise<TaxonomyReviewRunRecord> {
  const values: Partial<typeof taxonomyReviewRuns.$inferInsert> = {
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
  if (input.generatedAt !== undefined) values.generatedAt = input.generatedAt;
  if (input.reviewedAt !== undefined) values.reviewedAt = input.reviewedAt;

  const where = options.onlyIfActive
    ? and(
        eq(taxonomyReviewRuns.id, id),
        inArray(taxonomyReviewRuns.status, ["pending", "running"]),
      )
    : eq(taxonomyReviewRuns.id, id);

  const [record] = await getDb()
    .update(taxonomyReviewRuns)
    .set(values)
    .where(where)
    .returning();

  if (!record) {
    throw new Error(
      options.onlyIfActive
        ? "Taxonomy review run update skipped: the run already reached a terminal state."
        : "Taxonomy review run update did not return a record.",
    );
  }

  return record;
}

export async function completeTaxonomyReviewRun(
  id: string,
  input: Omit<UpdateTaxonomyReviewRunInput, "status" | "generatedAt"> & {
    status: Extract<TaxonomyReviewRunStatusValue, "succeeded" | "failed">;
    generatedAt?: Date | null;
  },
  suggestions: TaxonomySuggestion[],
): Promise<TaxonomyReviewRunRecord> {
  const db = getDb();

  return db.transaction(async (tx) => {
    await tx.delete(taxonomyReviewSuggestions).where(eq(taxonomyReviewSuggestions.runId, id));

    if (suggestions.length > 0) {
      await tx.insert(taxonomyReviewSuggestions).values(
        suggestions.map((suggestion) => ({
          runId: id,
          targetGroup: suggestion.targetGroup,
          action: suggestion.action,
          status: "pending" as const,
          currentValue: suggestion.currentValue ?? null,
          proposedValue: suggestion.proposedValue ?? null,
          originalValue: suggestion.currentValue ?? suggestion.proposedValue ?? null,
          reason: suggestion.reason,
          confidence: suggestion.confidence,
          evidenceRefs: suggestion.evidenceRefs,
          affectedRecords: suggestion.affectedRecords ?? [],
        })),
      );
    }

    const values: Partial<typeof taxonomyReviewRuns.$inferInsert> = {
      status: input.status,
      rawResponse: input.rawResponse,
      outputJson: input.outputJson,
      validationNotes: input.validationNotes,
      tokenUsage: input.tokenUsage,
      attempts: input.attempts,
      errorStage: input.errorStage,
      errorMessage: input.errorMessage,
      completedAt: input.completedAt,
      durationMs: input.durationMs,
      generatedAt: input.generatedAt ?? new Date(),
      updatedAt: new Date(),
    };

    const [record] = await tx
      .update(taxonomyReviewRuns)
      .set(values)
      .where(
        and(
          eq(taxonomyReviewRuns.id, id),
          inArray(taxonomyReviewRuns.status, ["pending", "running"]),
        ),
      )
      .returning();

    if (!record) {
      throw new Error("Taxonomy review completion skipped: the run is no longer active.");
    }

    return record;
  });
}

export async function getTaxonomyReviewRuns(
  limit = 30,
): Promise<TaxonomyReviewRunRecord[]> {
  if (!hasDatabaseUrl()) {
    return [];
  }

  try {
    return await getDb()
      .select()
      .from(taxonomyReviewRuns)
      .orderBy(desc(taxonomyReviewRuns.createdAt))
      .limit(limit);
  } catch (error) {
    console.error("[db] taxonomy_review_runs read failed; treating as empty:", error);
    return [];
  }
}

export async function getActiveTaxonomyReviewRun(): Promise<TaxonomyReviewRunRecord | null> {
  if (!hasDatabaseUrl()) {
    return null;
  }

  try {
    const [record] = await getDb()
      .select()
      .from(taxonomyReviewRuns)
      .where(inArray(taxonomyReviewRuns.status, ["pending", "running"]))
      .orderBy(desc(taxonomyReviewRuns.createdAt))
      .limit(1);

    return record ?? null;
  } catch (error) {
    console.error("[db] taxonomy_review_runs read failed; treating as missing:", error);
    return null;
  }
}

export async function getLatestTaxonomyReviewRunWithSuggestions(): Promise<TaxonomyReviewRunWithSuggestions | null> {
  if (!hasDatabaseUrl()) {
    return null;
  }

  try {
    const [run] = await getDb()
      .select()
      .from(taxonomyReviewRuns)
      .orderBy(desc(taxonomyReviewRuns.createdAt))
      .limit(1);

    if (!run) {
      return null;
    }

    const suggestions = await getDb()
      .select()
      .from(taxonomyReviewSuggestions)
      .where(eq(taxonomyReviewSuggestions.runId, run.id))
      .orderBy(taxonomyReviewSuggestions.targetGroup, taxonomyReviewSuggestions.createdAt);

    return { ...run, suggestions };
  } catch (error) {
    console.error("[db] taxonomy review read failed; treating as missing:", error);
    return null;
  }
}

export async function getTaxonomyReviewRunWithSuggestions(
  id: string,
): Promise<TaxonomyReviewRunWithSuggestions | null> {
  if (!hasDatabaseUrl()) {
    return null;
  }

  try {
    const [run] = await getDb()
      .select()
      .from(taxonomyReviewRuns)
      .where(eq(taxonomyReviewRuns.id, id))
      .limit(1);

    if (!run) {
      return null;
    }

    const suggestions = await getDb()
      .select()
      .from(taxonomyReviewSuggestions)
      .where(eq(taxonomyReviewSuggestions.runId, run.id))
      .orderBy(taxonomyReviewSuggestions.targetGroup, taxonomyReviewSuggestions.createdAt);

    return { ...run, suggestions };
  } catch (error) {
    console.error("[db] taxonomy review read failed; treating as missing:", error);
    return null;
  }
}

export async function setTaxonomySuggestionStatus(input: {
  id: string;
  status: TaxonomySuggestionStatus;
}): Promise<TaxonomyReviewSuggestionRecord> {
  const now = new Date();
  const db = getDb();

  return db.transaction(async (tx) => {
    const [record] = await tx
      .update(taxonomyReviewSuggestions)
      .set({ status: input.status, reviewedAt: now, updatedAt: now })
      .where(eq(taxonomyReviewSuggestions.id, input.id))
      .returning();

    if (!record) {
      throw new Error("Taxonomy review suggestion not found.");
    }

    await tx
      .update(taxonomyReviewRuns)
      .set({ reviewedAt: now, updatedAt: now })
      .where(eq(taxonomyReviewRuns.id, record.runId));

    return record;
  });
}

export async function bulkSetTaxonomySuggestionStatus(input: {
  runId: string;
  status: TaxonomySuggestionStatus;
  targetGroup?: TaxonomyTargetGroup | null;
}): Promise<number> {
  const now = new Date();
  const db = getDb();

  return db.transaction(async (tx) => {
    const where = input.targetGroup
      ? and(
          eq(taxonomyReviewSuggestions.runId, input.runId),
          eq(taxonomyReviewSuggestions.targetGroup, input.targetGroup),
          eq(taxonomyReviewSuggestions.status, "pending"),
        )
      : and(
          eq(taxonomyReviewSuggestions.runId, input.runId),
          eq(taxonomyReviewSuggestions.status, "pending"),
        );

    const records = await tx
      .update(taxonomyReviewSuggestions)
      .set({ status: input.status, reviewedAt: now, updatedAt: now })
      .where(where)
      .returning({ id: taxonomyReviewSuggestions.id });

    if (records.length > 0) {
      await tx
        .update(taxonomyReviewRuns)
        .set({ reviewedAt: now, updatedAt: now })
        .where(eq(taxonomyReviewRuns.id, input.runId));
    }

    return records.length;
  });
}

export async function getTaxonomyReviewSource(): Promise<TaxonomyReviewSource> {
  const [
    index,
    experienceLensRows,
    experiencePrincipleRows,
    experienceSkillRows,
    experienceTagRows,
    projectLensRows,
    projectPrincipleRows,
    projectSkillRows,
    projectTagRows,
    caseStudyLensRows,
    caseStudyPrincipleRows,
    caseStudySkillRows,
    caseStudyTagRows,
    decisionPatternPrincipleRows,
  ] = await Promise.all([
    getAdminContentIndex(),
    readArray((db) => db.select().from(experienceLenses)),
    readArray((db) => db.select().from(experiencePrinciples)),
    readArray((db) => db.select().from(experienceSkills)),
    readArray((db) => db.select().from(experienceTags)),
    readArray((db) => db.select().from(projectLenses)),
    readArray((db) => db.select().from(projectPrinciples)),
    readArray((db) => db.select().from(projectSkills)),
    readArray((db) => db.select().from(projectTags)),
    readArray((db) => db.select().from(caseStudyLenses)),
    readArray((db) => db.select().from(caseStudyPrinciples)),
    readArray((db) => db.select().from(caseStudySkills)),
    readArray((db) => db.select().from(caseStudyTags)),
    readArray((db) => db.select().from(decisionPatternPrinciples)),
  ]);

  return {
    index,
    relations: {
      experienceLenses: experienceLensRows.map((row) => ({
        left: row.experienceId,
        right: row.lensId,
      })),
      experiencePrinciples: experiencePrincipleRows.map((row) => ({
        left: row.experienceId,
        right: row.principleId,
      })),
      experienceSkills: experienceSkillRows.map((row) => ({
        left: row.experienceId,
        right: row.skillId,
      })),
      experienceTags: experienceTagRows.map((row) => ({
        left: row.experienceId,
        right: row.tagId,
      })),
      projectLenses: projectLensRows.map((row) => ({
        left: row.projectId,
        right: row.lensId,
      })),
      projectPrinciples: projectPrincipleRows.map((row) => ({
        left: row.projectId,
        right: row.principleId,
      })),
      projectSkills: projectSkillRows.map((row) => ({
        left: row.projectId,
        right: row.skillId,
      })),
      projectTags: projectTagRows.map((row) => ({
        left: row.projectId,
        right: row.tagId,
      })),
      caseStudyLenses: caseStudyLensRows.map((row) => ({
        left: row.caseStudyId,
        right: row.lensId,
      })),
      caseStudyPrinciples: caseStudyPrincipleRows.map((row) => ({
        left: row.caseStudyId,
        right: row.principleId,
      })),
      caseStudySkills: caseStudySkillRows.map((row) => ({
        left: row.caseStudyId,
        right: row.skillId,
      })),
      caseStudyTags: caseStudyTagRows.map((row) => ({
        left: row.caseStudyId,
        right: row.tagId,
      })),
      decisionPatternPrinciples: decisionPatternPrincipleRows.map((row) => ({
        left: row.decisionPatternId,
        right: row.principleId,
      })),
    },
  };
}

async function readArray<T>(reader: (db: PortfolioDb) => Promise<T[]>): Promise<T[]> {
  if (!hasDatabaseUrl()) {
    return [];
  }

  try {
    return await reader(getDb());
  } catch (error) {
    console.error("[db] taxonomy review source read failed; treating as empty:", error);
    return [];
  }
}
