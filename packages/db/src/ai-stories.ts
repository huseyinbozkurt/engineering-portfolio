import { desc, eq, type InferSelectModel } from "drizzle-orm";

import type {
  CreateCaseStudyInput,
  CreateDecisionPatternInput,
  CreateExperienceInput,
  CreatePrincipleInput,
  CreateProjectInput,
  CreateSkillInput,
  CreateTagInput,
} from "@portfolio/validators";

import { getDb, type PortfolioDb } from "./client";
import {
  aiGeneratedStories,
  caseStudies,
  caseStudyExperiences,
  caseStudyLenses,
  caseStudyPrinciples,
  caseStudyProjects,
  caseStudySkills,
  caseStudyTags,
  decisionPatterns,
  decisionPatternPrinciples,
  experienceLenses,
  experiencePrinciples,
  experienceSkills,
  experienceTags,
  experiences,
  lenses,
  principles,
  projectLenses,
  projectPrinciples,
  projectSkills,
  projectTags,
  projects,
  skills,
  tags,
  type AiGeneratedStoryPart,
  type AiGeneratedStoryPayload,
  type AiGeneratedStoryStatus,
  type ContentStatus,
} from "./schema";

export type AiGeneratedStoryRecord = InferSelectModel<typeof aiGeneratedStories>;
export type AiStoryPartKind = AiGeneratedStoryPart["kind"];

type ApplyDb = Pick<PortfolioDb, "insert" | "select" | "update">;
type AiGeneratedStoryTargetType = "case_study";

const maxSlugLength = 120;

export class AiGeneratedStoryApplyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiGeneratedStoryApplyError";
  }
}

export interface CreateAiGeneratedStoryInput {
  title: string;
  sourcePrompt: string;
  providerName: string | null;
  providerModel: string | null;
  generatedContent: AiGeneratedStoryPayload;
  rawResponse?: string | null;
  finishReason?: string | null;
}

export interface UpdateAiStoryPartInput {
  title: string;
  summary: string;
  fields: Record<string, unknown>;
  relations: Record<string, string[] | string | null>;
}

interface ExistingRelationIds {
  lensIds: Set<string>;
  principleIds: Set<string>;
  experienceIds: Set<string>;
  projectIds: Set<string>;
  skillIds: Set<string>;
  tagIds: Set<string>;
}

const applyOrder: AiStoryPartKind[] = [
  "skill",
  "tag",
  "principle",
  "decisionPattern",
  "experience",
  "project",
  "caseStudy",
];

export async function getAiGeneratedStories(): Promise<AiGeneratedStoryRecord[]> {
  return getDb()
    .select()
    .from(aiGeneratedStories)
    .orderBy(desc(aiGeneratedStories.createdAt));
}

export async function getAiGeneratedStory(
  id: string,
  db: ApplyDb = getDb(),
): Promise<AiGeneratedStoryRecord | null> {
  const [story] = await db
    .select()
    .from(aiGeneratedStories)
    .where(eq(aiGeneratedStories.id, id))
    .limit(1);

  return story ?? null;
}

export async function createAiGeneratedStory(
  input: CreateAiGeneratedStoryInput,
): Promise<string> {
  const [story] = await getDb()
    .insert(aiGeneratedStories)
    .values({
      title: input.title,
      sourcePrompt: input.sourcePrompt,
      providerName: input.providerName,
      providerModel: input.providerModel,
      generatedContent: input.generatedContent,
      rawResponse: input.rawResponse ?? null,
      finishReason: input.finishReason ?? null,
    })
    .returning({ id: aiGeneratedStories.id });

  if (!story) {
    throw new Error("AI generated story insert did not return a record.");
  }

  return story.id;
}

export async function updateAiGeneratedStoryPart(
  storyId: string,
  partId: string,
  input: UpdateAiStoryPartInput,
): Promise<void> {
  const story = await requiredStory(storyId);
  ensureMutableStory(story);
  const payload = updatePart(story.generatedContent, partId, (part) => ({
    ...part,
    title: input.title,
    summary: input.summary,
    fields: input.fields,
    relations: input.relations,
  }));

  await savePayload(storyId, payload);
}

export async function softDeleteAiGeneratedStoryPart(
  storyId: string,
  partId: string,
): Promise<void> {
  const story = await requiredStory(storyId);
  const existingPart = story.generatedContent.parts.find((part) => part.id === partId);
  if (!existingPart) {
    throw new Error("AI generated story part was not found.");
  }

  if (story.status === "applied") {
    await setAppliedRecordStatus(existingPart, "draft");
  } else {
    ensureMutableStory(story);
  }

  const deletedAt = new Date().toISOString();
  const payload = updatePart(story.generatedContent, partId, (part) => ({
    ...part,
    deletedAt,
  }));

  await savePayload(
    storyId,
    payload,
    story.status === "applied"
      ? { status: story.status, appliedAt: story.appliedAt }
      : undefined,
  );
}

export async function restoreAiGeneratedStoryPart(
  storyId: string,
  partId: string,
): Promise<void> {
  const story = await requiredStory(storyId);
  ensureMutableStory(story);
  const payload = updatePart(story.generatedContent, partId, (part) => ({
    ...part,
    deletedAt: null,
  }));

  await savePayload(storyId, payload);
}

export async function applyAiGeneratedStory(storyId: string): Promise<void> {
  const db = getDb();

  await db.transaction(async (tx) => {
    const story = await requiredStoryForApply(storyId, tx);

    if (story.status === "applied" || story.targetId) {
      throw new AiGeneratedStoryApplyError(
        "This AI story has already been applied, so it cannot be applied again.",
      );
    }

    const payload = story.generatedContent;
    const activeParts = payload.parts.filter((part) => !part.deletedAt);
    const generatedIdToRecordId = new Map(
      payload.parts.flatMap((part): [string, string][] =>
        part.appliedRecordId ? [[part.id, part.appliedRecordId]] : [],
      ),
    );
    const existingRelationIds = await getExistingRelationIds(tx);
    const updatedParts = payload.parts.map((part) => ({ ...part }));
    let targetId: string | null = null;
    let targetType: AiGeneratedStoryTargetType | null = null;

    for (const kind of applyOrder) {
      const partsForKind = activeParts.filter((part) => part.kind === kind);

      for (const part of partsForKind) {
        const recordId = await createRecordFromPart(
          tx,
          part,
          generatedIdToRecordId,
          existingRelationIds,
        );
        generatedIdToRecordId.set(part.id, recordId);

        if (part.kind === "caseStudy" && !targetId) {
          targetId = recordId;
          targetType = "case_study";
        }

        const mutablePart = updatedParts.find((candidate) => candidate.id === part.id);
        if (mutablePart) {
          mutablePart.appliedRecordId = recordId;
        }
      }
    }

    await tx
      .update(aiGeneratedStories)
      .set({
        status: "applied",
        appliedAt: new Date(),
        targetType,
        targetId,
        errorMessage: null,
        generatedContent: {
          ...payload,
          parts: updatedParts,
        },
        updatedAt: new Date(),
      })
      .where(eq(aiGeneratedStories.id, storyId));
  });
}

export async function rollbackAiGeneratedStory(storyId: string): Promise<void> {
  const story = await requiredStory(storyId);
  const deletedAt = new Date().toISOString();

  await Promise.all(
    story.generatedContent.parts.map((part) => setAppliedRecordStatus(part, "draft")),
  );

  await getDb()
    .update(aiGeneratedStories)
    .set({
      status: "draft" satisfies AiGeneratedStoryStatus,
      appliedAt: null,
      generatedContent: {
        ...story.generatedContent,
        parts: story.generatedContent.parts.map((part) => ({
          ...part,
          deletedAt: part.deletedAt ?? deletedAt,
        })),
      },
      updatedAt: new Date(),
    })
    .where(eq(aiGeneratedStories.id, storyId));
}

async function requiredStory(
  id: string,
  db: ApplyDb = getDb(),
): Promise<AiGeneratedStoryRecord> {
  const story = await getAiGeneratedStory(id, db);

  if (!story) {
    throw new Error("AI generated story was not found.");
  }

  return story;
}

async function requiredStoryForApply(
  id: string,
  db: ApplyDb,
): Promise<AiGeneratedStoryRecord> {
  const [story] = await db
    .select()
    .from(aiGeneratedStories)
    .where(eq(aiGeneratedStories.id, id))
    .limit(1)
    .for("update");

  if (!story) {
    throw new AiGeneratedStoryApplyError("AI generated story was not found.");
  }

  return story;
}

function ensureMutableStory(story: AiGeneratedStoryRecord): void {
  if (story.status === "applied") {
    throw new Error("Applied AI stories cannot be edited.");
  }
}

async function savePayload(
  storyId: string,
  payload: AiGeneratedStoryPayload,
  options: {
    status: AiGeneratedStoryStatus;
    appliedAt: Date | null;
  } = { status: "draft", appliedAt: null },
): Promise<void> {
  await getDb()
    .update(aiGeneratedStories)
    .set({
      generatedContent: payload,
      status: options.status,
      appliedAt: options.appliedAt,
      updatedAt: new Date(),
    })
    .where(eq(aiGeneratedStories.id, storyId));
}

function updatePart(
  payload: AiGeneratedStoryPayload,
  partId: string,
  updater: (part: AiGeneratedStoryPart) => AiGeneratedStoryPart,
): AiGeneratedStoryPayload {
  let found = false;
  const parts = payload.parts.map((part) => {
    if (part.id !== partId) {
      return part;
    }

    found = true;
    return updater(part);
  });

  if (!found) {
    throw new Error("AI generated story part was not found.");
  }

  return { ...payload, parts };
}

async function createRecordFromPart(
  db: ApplyDb,
  part: AiGeneratedStoryPart,
  generatedIdToRecordId: Map<string, string>,
  existingRelationIds: ExistingRelationIds,
): Promise<string> {
  if (part.appliedRecordId && (await setAppliedRecordStatus(part, "published", db))) {
    if (part.kind === "caseStudy") {
      await insertCaseStudyExperienceRelations(
        db,
        part.appliedRecordId,
        caseStudyExperienceIds(part, generatedIdToRecordId, existingRelationIds),
      );
    }

    return part.appliedRecordId;
  }

  switch (part.kind) {
    case "lens":
      throw new Error("AI stories cannot create new lens records.");
    case "principle":
      return insertPrinciple(db, toPrincipleInput(part));
    case "decisionPattern":
      return insertDecisionPattern(
        db,
        toDecisionPatternInput(part, generatedIdToRecordId, existingRelationIds),
      );
    case "experience":
      return insertExperience(
        db,
        toExperienceInput(part, generatedIdToRecordId, existingRelationIds),
      );
    case "project":
      return insertProject(db, toProjectInput(part, generatedIdToRecordId, existingRelationIds));
    case "caseStudy":
      return insertCaseStudy(
        db,
        toCaseStudyInput(part, generatedIdToRecordId, existingRelationIds),
      );
    case "skill":
      return insertSkill(db, toSkillInput(part));
    case "tag":
      return insertTag(db, toTagInput(part));
  }
}

function inserted<T extends { id: string }>(records: T[]): T {
  const record = records[0];

  if (!record) {
    throw new Error("Insert did not return a record.");
  }

  return record;
}

function workflowValues(status: ContentStatus): {
  status: ContentStatus;
  publishedAt: Date | null;
  archivedAt: Date | null;
} {
  return {
    status,
    publishedAt: status === "published" ? new Date() : null,
    archivedAt: status === "archived" ? new Date() : null,
  };
}

async function insertPrinciple(
  db: ApplyDb,
  input: CreatePrincipleInput,
): Promise<string> {
  const record = inserted(
    await db
      .insert(principles)
      .values({ ...input, ...workflowValues(input.status) })
      .returning({ id: principles.id }),
  );

  return record.id;
}

async function insertDecisionPattern(
  db: ApplyDb,
  input: CreateDecisionPatternInput,
): Promise<string> {
  const record = inserted(
    await db
      .insert(decisionPatterns)
      .values({
        slug: input.slug,
        title: input.title,
        summary: input.summary,
        body: input.body,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        ogImage: input.ogImage,
        ...workflowValues(input.status),
        position: input.position,
      })
      .returning({ id: decisionPatterns.id }),
  );

  if (input.principleIds.length > 0) {
    await db
      .insert(decisionPatternPrinciples)
      .values(
        input.principleIds.map((principleId) => ({
          decisionPatternId: record.id,
          principleId,
        })),
      )
      .onConflictDoNothing();
  }

  return record.id;
}

async function insertExperience(
  db: ApplyDb,
  input: CreateExperienceInput,
): Promise<string> {
  const record = inserted(
    await db
      .insert(experiences)
      .values({
        slug: input.slug,
        company: input.company,
        role: input.role,
        location: input.location,
        startDate: input.startDate,
        endDate: input.endDate,
        isCurrent: input.isCurrent,
        summary: input.summary,
        details: input.details,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        ogImage: input.ogImage,
        ...workflowValues(input.status),
        position: input.position,
      })
      .returning({ id: experiences.id }),
  );

  if (input.lensIds.length > 0) {
    await db
      .insert(experienceLenses)
      .values(input.lensIds.map((lensId) => ({ experienceId: record.id, lensId })))
      .onConflictDoNothing();
  }

  if (input.principleIds.length > 0) {
    await db
      .insert(experiencePrinciples)
      .values(
        input.principleIds.map((principleId) => ({
          experienceId: record.id,
          principleId,
        })),
      )
      .onConflictDoNothing();
  }

  if (input.skillIds.length > 0) {
    await db
      .insert(experienceSkills)
      .values(input.skillIds.map((skillId) => ({ experienceId: record.id, skillId })))
      .onConflictDoNothing();
  }

  if (input.tagIds.length > 0) {
    await db
      .insert(experienceTags)
      .values(input.tagIds.map((tagId) => ({ experienceId: record.id, tagId })))
      .onConflictDoNothing();
  }

  return record.id;
}

async function insertProject(db: ApplyDb, input: CreateProjectInput): Promise<string> {
  const record = inserted(
    await db
      .insert(projects)
      .values({
        slug: input.slug,
        name: input.name,
        description: input.description,
        details: input.details,
        url: input.url,
        githubUrl: input.githubUrl,
        experienceId: input.experienceId,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        ogImage: input.ogImage,
        ...workflowValues(input.status),
        position: input.position,
      })
      .returning({ id: projects.id }),
  );

  if (input.lensIds.length > 0) {
    await db
      .insert(projectLenses)
      .values(input.lensIds.map((lensId) => ({ projectId: record.id, lensId })))
      .onConflictDoNothing();
  }

  if (input.principleIds.length > 0) {
    await db
      .insert(projectPrinciples)
      .values(input.principleIds.map((principleId) => ({ projectId: record.id, principleId })))
      .onConflictDoNothing();
  }

  if (input.skillIds.length > 0) {
    await db
      .insert(projectSkills)
      .values(input.skillIds.map((skillId) => ({ projectId: record.id, skillId })))
      .onConflictDoNothing();
  }

  if (input.tagIds.length > 0) {
    await db
      .insert(projectTags)
      .values(input.tagIds.map((tagId) => ({ projectId: record.id, tagId })))
      .onConflictDoNothing();
  }

  return record.id;
}

async function insertCaseStudy(
  db: ApplyDb,
  input: CreateCaseStudyInput,
): Promise<string> {
  const record = await insertCaseStudyWithUniqueSlug(db, input);

  if (input.lensIds.length > 0) {
    await db
      .insert(caseStudyLenses)
      .values(input.lensIds.map((lensId) => ({ caseStudyId: record.id, lensId })))
      .onConflictDoNothing();
  }

  if (input.principleIds.length > 0) {
    await db
      .insert(caseStudyPrinciples)
      .values(
        input.principleIds.map((principleId) => ({
          caseStudyId: record.id,
          principleId,
        })),
      )
      .onConflictDoNothing();
  }

  if (input.experienceIds.length > 0) {
    await insertCaseStudyExperienceRelations(db, record.id, input.experienceIds);
  }

  if (input.projectIds.length > 0) {
    await db
      .insert(caseStudyProjects)
      .values(input.projectIds.map((projectId) => ({ caseStudyId: record.id, projectId })))
      .onConflictDoNothing();
  }

  if (input.skillIds.length > 0) {
    await db
      .insert(caseStudySkills)
      .values(input.skillIds.map((skillId) => ({ caseStudyId: record.id, skillId })))
      .onConflictDoNothing();
  }

  if (input.tagIds.length > 0) {
    await db
      .insert(caseStudyTags)
      .values(input.tagIds.map((tagId) => ({ caseStudyId: record.id, tagId })))
      .onConflictDoNothing();
  }

  return record.id;
}

async function insertCaseStudyWithUniqueSlug(
  db: ApplyDb,
  input: CreateCaseStudyInput,
): Promise<{ id: string }> {
  const usedSlugs = new Set(
    (await db.select({ slug: caseStudies.slug }).from(caseStudies)).map((row) => row.slug),
  );
  const baseSlug = trimSlugToMaxLength(input.slug);

  for (let suffix = 1; suffix < 10_000; suffix += 1) {
    const slug = suffix === 1 ? baseSlug : slugWithNumericSuffix(baseSlug, suffix);

    if (usedSlugs.has(slug)) {
      continue;
    }

    const [record] = await db
      .insert(caseStudies)
      .values({
        slug,
        title: input.title,
        excerpt: input.excerpt,
        context: input.context,
        problem: input.problem,
        constraints: input.constraints,
        action: input.action,
        tradeoffs: input.tradeoffs,
        outcome: input.outcome,
        learning: input.learning,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        ogImage: input.ogImage,
        ...workflowValues(input.status),
        position: input.position,
      })
      .onConflictDoNothing({ target: caseStudies.slug })
      .returning({ id: caseStudies.id });

    if (record) {
      return record;
    }

    usedSlugs.add(slug);
  }

  throw new AiGeneratedStoryApplyError(
    `Could not create a unique case study slug for "${input.title}".`,
  );
}

async function insertCaseStudyExperienceRelations(
  db: ApplyDb,
  caseStudyId: string,
  experienceIds: string[],
): Promise<void> {
  if (experienceIds.length === 0) {
    return;
  }

  await db
    .insert(caseStudyExperiences)
    .values(
      experienceIds.map((experienceId) => ({
        caseStudyId,
        experienceId,
      })),
    )
    .onConflictDoNothing();
}

async function insertSkill(db: ApplyDb, input: CreateSkillInput): Promise<string> {
  const record = inserted(
    await db
      .insert(skills)
      .values({ ...input, ...workflowValues(input.status) })
      .returning({ id: skills.id }),
  );

  return record.id;
}

async function insertTag(db: ApplyDb, input: CreateTagInput): Promise<string> {
  const record = inserted(
    await db
      .insert(tags)
      .values({ ...input, ...workflowValues(input.status) })
      .returning({ id: tags.id }),
  );

  return record.id;
}

function toPrincipleInput(part: AiGeneratedStoryPart): CreatePrincipleInput {
  return {
    slug: slug(part, "slug", part.title),
    title: textField(part, "title", part.title),
    summary: textField(part, "summary", part.summary),
    body: textField(part, "body", part.summary),
    status: "published",
    seoTitle: nullableTextField(part, "seoTitle"),
    seoDescription: nullableTextField(part, "seoDescription"),
    ogImage: nullableTextField(part, "ogImage"),
    position: numberField(part, "position"),
  };
}

function toDecisionPatternInput(
  part: AiGeneratedStoryPart,
  idMap: Map<string, string>,
  existingRelationIds: ExistingRelationIds,
): CreateDecisionPatternInput {
  return {
    slug: slug(part, "slug", part.title),
    title: textField(part, "title", part.title),
    summary: textField(part, "summary", part.summary),
    body: textField(part, "body", part.summary),
    status: "published",
    seoTitle: nullableTextField(part, "seoTitle"),
    seoDescription: nullableTextField(part, "seoDescription"),
    ogImage: nullableTextField(part, "ogImage"),
    principleIds: relationIds(part, "principleIds", idMap, existingRelationIds),
    position: numberField(part, "position"),
  };
}

function toExperienceInput(
  part: AiGeneratedStoryPart,
  idMap: Map<string, string>,
  existingRelationIds: ExistingRelationIds,
): CreateExperienceInput {
  return {
    slug: nullableSlug(part, "slug", part.title),
    company: textField(part, "company", "Independent"),
    role: textField(part, "role", part.title),
    location: nullableTextField(part, "location"),
    startDate: nullableTextField(part, "startDate"),
    endDate: nullableTextField(part, "endDate"),
    isCurrent: booleanField(part, "isCurrent"),
    summary: textField(part, "summary", part.summary),
    details: textField(part, "details", part.summary),
    awards: textField(part, "awards", ""),
    status: "published",
    seoTitle: nullableTextField(part, "seoTitle"),
    seoDescription: nullableTextField(part, "seoDescription"),
    ogImage: nullableTextField(part, "ogImage"),
    lensIds: relationIds(part, "lensIds", idMap, existingRelationIds),
    principleIds: relationIds(part, "principleIds", idMap, existingRelationIds),
    skillIds: relationIds(part, "skillIds", idMap, existingRelationIds),
    tagIds: relationIds(part, "tagIds", idMap, existingRelationIds),
    position: numberField(part, "position"),
  };
}

function toProjectInput(
  part: AiGeneratedStoryPart,
  idMap: Map<string, string>,
  existingRelationIds: ExistingRelationIds,
): CreateProjectInput {
  return {
    slug: slug(part, "slug", part.title),
    name: textField(part, "name", part.title),
    description: textField(part, "description", part.summary),
    details: textField(part, "details", part.summary),
    architecture: textField(part, "architecture", ""),
    developmentTechStack: textField(part, "developmentTechStack", ""),
    qaTechStack: textField(part, "qaTechStack", ""),
    aiIntegrationTechStack: textField(part, "aiIntegrationTechStack", ""),
    deploymentTechStack: textField(part, "deploymentTechStack", ""),
    status: "published",
    url: nullableTextField(part, "url"),
    githubUrl: nullableTextField(part, "githubUrl"),
    seoTitle: nullableTextField(part, "seoTitle"),
    seoDescription: nullableTextField(part, "seoDescription"),
    ogImage: nullableTextField(part, "ogImage"),
    experienceId: relationId(part, "experienceId", idMap, existingRelationIds),
    lensIds: relationIds(part, "lensIds", idMap, existingRelationIds),
    principleIds: relationIds(part, "principleIds", idMap, existingRelationIds),
    skillIds: relationIds(part, "skillIds", idMap, existingRelationIds),
    tagIds: relationIds(part, "tagIds", idMap, existingRelationIds),
    position: numberField(part, "position"),
  };
}

function toCaseStudyInput(
  part: AiGeneratedStoryPart,
  idMap: Map<string, string>,
  existingRelationIds: ExistingRelationIds,
): CreateCaseStudyInput {
  return {
    slug: slug(part, "slug", part.title),
    title: textField(part, "title", part.title),
    excerpt: textField(part, "excerpt", part.summary),
    status: "published",
    seoTitle: nullableTextField(part, "seoTitle"),
    seoDescription: nullableTextField(part, "seoDescription"),
    ogImage: nullableTextField(part, "ogImage"),
    context: textField(part, "context", part.summary),
    problem: textField(part, "problem", ""),
    constraints: textField(part, "constraints", ""),
    action: textField(part, "action", ""),
    tradeoffs: textField(part, "tradeoffs", ""),
    outcome: textField(part, "outcome", ""),
    learning: textField(part, "learning", ""),
    lensIds: relationIds(part, "lensIds", idMap, existingRelationIds),
    principleIds: relationIds(part, "principleIds", idMap, existingRelationIds),
    experienceIds: caseStudyExperienceIds(part, idMap, existingRelationIds),
    projectIds: relationIds(part, "projectIds", idMap, existingRelationIds),
    skillIds: relationIds(part, "skillIds", idMap, existingRelationIds),
    tagIds: relationIds(part, "tagIds", idMap, existingRelationIds),
    position: numberField(part, "position"),
  };
}

function toSkillInput(part: AiGeneratedStoryPart): CreateSkillInput {
  return {
    slug: slug(part, "slug", part.title),
    name: textField(part, "name", part.title),
    category: nullableTextField(part, "category"),
    summary: textField(part, "summary", part.summary),
    status: "published",
    position: numberField(part, "position"),
  };
}

function toTagInput(part: AiGeneratedStoryPart): CreateTagInput {
  return {
    slug: slug(part, "slug", part.title),
    name: textField(part, "name", part.title),
    category: nullableTextField(part, "category"),
    status: "published",
  };
}

function textField(part: AiGeneratedStoryPart, key: string, fallback: string): string {
  const value = part.fields[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function nullableTextField(part: AiGeneratedStoryPart, key: string): string | null {
  const value = part.fields[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberField(part: AiGeneratedStoryPart, key: string): number {
  const value = part.fields[key];
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isInteger(numeric) ? numeric : 0;
}

function booleanField(part: AiGeneratedStoryPart, key: string): boolean {
  return part.fields[key] === true || part.fields[key] === "true";
}

function slug(part: AiGeneratedStoryPart, key: string, fallback: string): string {
  const raw = textField(part, key, fallback);
  return slugify(raw);
}

function nullableSlug(
  part: AiGeneratedStoryPart,
  key: string,
  fallback: string,
): string | null {
  return slug(part, key, fallback);
}

function relationIds(
  part: AiGeneratedStoryPart,
  key: string,
  idMap: Map<string, string>,
  existingRelationIds: ExistingRelationIds,
): string[] {
  const value = part.relations?.[key];
  const ids = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  const targetSet = existingIdsForRelationKey(key, existingRelationIds);

  return uniqueStrings(ids.flatMap((id) => {
    const recordId = idMap.get(id);
    if (recordId) {
      return [recordId];
    }

    if (targetSet?.has(id)) {
      return [id];
    }

    return [];
  }));
}

function relationId(
  part: AiGeneratedStoryPart,
  key: string,
  idMap: Map<string, string>,
  existingRelationIds: ExistingRelationIds,
): string | null {
  return relationIds(part, key, idMap, existingRelationIds)[0] ?? null;
}

function caseStudyExperienceIds(
  part: AiGeneratedStoryPart,
  idMap: Map<string, string>,
  existingRelationIds: ExistingRelationIds,
): string[] {
  const ids = uniqueStrings([
    ...relationIds(part, "experienceIds", idMap, existingRelationIds),
    ...relationIds(part, "experienceId", idMap, existingRelationIds),
  ]);

  if (ids.length === 0) {
    throw new AiGeneratedStoryApplyError(
      `Link "${part.title}" to a source experience before applying the AI story.`,
    );
  }

  return ids;
}

async function getExistingRelationIds(db: ApplyDb = getDb()): Promise<ExistingRelationIds> {
  const [
    lensRows,
    principleRows,
    experienceRows,
    projectRows,
    skillRows,
    tagRows,
  ] = await Promise.all([
    db.select({ id: lenses.id }).from(lenses),
    db.select({ id: principles.id }).from(principles),
    db.select({ id: experiences.id }).from(experiences),
    db.select({ id: projects.id }).from(projects),
    db.select({ id: skills.id }).from(skills),
    db.select({ id: tags.id }).from(tags),
  ]);

  return {
    lensIds: new Set(lensRows.map((row) => row.id)),
    principleIds: new Set(principleRows.map((row) => row.id)),
    experienceIds: new Set(experienceRows.map((row) => row.id)),
    projectIds: new Set(projectRows.map((row) => row.id)),
    skillIds: new Set(skillRows.map((row) => row.id)),
    tagIds: new Set(tagRows.map((row) => row.id)),
  };
}

async function setAppliedRecordStatus(
  part: AiGeneratedStoryPart,
  status: ContentStatus,
  db: ApplyDb = getDb(),
): Promise<boolean> {
  if (!part.appliedRecordId) {
    return false;
  }

  const values = contentStatusValues(status);

  switch (part.kind) {
    case "lens": {
      const [record] = await db
        .update(lenses)
        .set(values)
        .where(eq(lenses.id, part.appliedRecordId))
        .returning({ id: lenses.id });
      return Boolean(record);
    }
    case "principle": {
      const [record] = await db
        .update(principles)
        .set(values)
        .where(eq(principles.id, part.appliedRecordId))
        .returning({ id: principles.id });
      return Boolean(record);
    }
    case "decisionPattern": {
      const [record] = await db
        .update(decisionPatterns)
        .set(values)
        .where(eq(decisionPatterns.id, part.appliedRecordId))
        .returning({ id: decisionPatterns.id });
      return Boolean(record);
    }
    case "experience": {
      const [record] = await db
        .update(experiences)
        .set(values)
        .where(eq(experiences.id, part.appliedRecordId))
        .returning({ id: experiences.id });
      return Boolean(record);
    }
    case "project": {
      const [record] = await db
        .update(projects)
        .set(values)
        .where(eq(projects.id, part.appliedRecordId))
        .returning({ id: projects.id });
      return Boolean(record);
    }
    case "caseStudy": {
      const [record] = await db
        .update(caseStudies)
        .set(values)
        .where(eq(caseStudies.id, part.appliedRecordId))
        .returning({ id: caseStudies.id });
      return Boolean(record);
    }
    case "skill": {
      const [record] = await db
        .update(skills)
        .set(values)
        .where(eq(skills.id, part.appliedRecordId))
        .returning({ id: skills.id });
      return Boolean(record);
    }
    case "tag": {
      const [record] = await db
        .update(tags)
        .set(values)
        .where(eq(tags.id, part.appliedRecordId))
        .returning({ id: tags.id });
      return Boolean(record);
    }
  }
}

function contentStatusValues(status: ContentStatus): {
  status: ContentStatus;
  publishedAt: Date | null;
  archivedAt: Date | null;
  updatedAt: Date;
} {
  return {
    status,
    publishedAt: status === "published" ? new Date() : null,
    archivedAt: null,
    updatedAt: new Date(),
  };
}

function existingIdsForRelationKey(
  key: string,
  existingRelationIds: ExistingRelationIds,
): Set<string> | null {
  switch (key) {
    case "lensIds":
      return existingRelationIds.lensIds;
    case "principleIds":
      return existingRelationIds.principleIds;
    case "experienceId":
    case "experienceIds":
      return existingRelationIds.experienceIds;
    case "projectIds":
      return existingRelationIds.projectIds;
    case "skillIds":
      return existingRelationIds.skillIds;
    case "tagIds":
      return existingRelationIds.tagIds;
    default:
      return null;
  }
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function trimSlugToMaxLength(value: string): string {
  return value.slice(0, maxSlugLength).replace(/-+$/g, "") || "ai-generated-item";
}

function slugWithNumericSuffix(baseSlug: string, suffix: number): string {
  const suffixText = `-${suffix}`;
  const prefix = baseSlug
    .slice(0, maxSlugLength - suffixText.length)
    .replace(/-+$/g, "");

  return `${prefix || "ai-generated-item"}${suffixText}`;
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || "ai-generated-item";
}
