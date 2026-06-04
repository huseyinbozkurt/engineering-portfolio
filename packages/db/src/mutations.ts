import { eq, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

import type {
  BulkSkillsInput,
  BulkTagsInput,
  CreateCaseStudyInput,
  CreateDecisionPatternInput,
  CreateExperienceInput,
  CreateLensInput,
  CreatePrincipleInput,
  CreateProjectInput,
  CreateSkillInput,
  CreateTagInput,
  UpdateCaseStudyInput,
  UpdateDecisionPatternInput,
  UpdateExperienceInput,
  UpdateLensInput,
  UpdatePrincipleInput,
  UpdateProjectInput,
  UpdateSkillInput,
  UpdateTagInput,
} from "@portfolio/validators";

import { getDb } from "./client";
import type { ContentStatus } from "./schema";
import {
  caseStudies,
  caseStudyExperiences,
  caseStudyLenses,
  caseStudyPrinciples,
  caseStudyProjects,
  caseStudySkills,
  caseStudyTags,
  decisionPatternPrinciples,
  decisionPatterns,
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
} from "./schema";

function inserted<T extends { id: string }>(records: T[]): T {
  const record = records[0];

  if (!record) {
    throw new Error("Insert did not return a record.");
  }

  return record;
}

/**
 * Derives the workflow timestamp columns from the requested status so the
 * stored record stays internally consistent: `publishedAt` is stamped when a
 * record goes live, `archivedAt` when it is archived, and both are cleared
 * otherwise. AI metadata columns are intentionally left untouched (null) until
 * a review pipeline exists.
 */
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

/**
 * Workflow columns for an UPDATE. Unlike create, this preserves existing
 * timestamps: `publishedAt` is stamped the first time a record is published and
 * retained afterwards (so re-saving a published case study does not reorder it);
 * `archivedAt` likewise. `updatedAt` is always advanced. Uses SQL `coalesce`
 * against the live columns so no extra read is required.
 */
function workflowUpdate(
  status: ContentStatus,
  publishedAt: AnyPgColumn,
  archivedAt: AnyPgColumn,
) {
  return {
    status,
    publishedAt:
      status === "published" ? sql`coalesce(${publishedAt}, now())` : sql`${publishedAt}`,
    archivedAt: status === "archived" ? sql`coalesce(${archivedAt}, now())` : sql`${archivedAt}`,
    updatedAt: new Date(),
  };
}

export async function createLens(input: CreateLensInput): Promise<string> {
  const record = inserted(
    await getDb()
      .insert(lenses)
      .values({ ...input, ...workflowValues(input.status) })
      .returning({ id: lenses.id }),
  );

  return record.id;
}

export async function createPrinciple(input: CreatePrincipleInput): Promise<string> {
  const record = inserted(
    await getDb()
      .insert(principles)
      .values({ ...input, ...workflowValues(input.status) })
      .returning({ id: principles.id }),
  );

  return record.id;
}

export async function createDecisionPattern(input: CreateDecisionPatternInput): Promise<string> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const record = inserted(
      await tx
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
      await tx.insert(decisionPatternPrinciples).values(
        input.principleIds.map((principleId) => ({
          decisionPatternId: record.id,
          principleId,
        })),
      );
    }

    return record.id;
  });
}

export async function createExperience(input: CreateExperienceInput): Promise<string> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const record = inserted(
      await tx
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
          seoTitle: input.seoTitle,
          seoDescription: input.seoDescription,
          ogImage: input.ogImage,
          ...workflowValues(input.status),
          position: input.position,
        })
        .returning({ id: experiences.id }),
    );

    if (input.lensIds.length > 0) {
      await tx.insert(experienceLenses).values(
        input.lensIds.map((lensId) => ({
          experienceId: record.id,
          lensId,
        })),
      );
    }

    if (input.principleIds.length > 0) {
      await tx.insert(experiencePrinciples).values(
        input.principleIds.map((principleId) => ({
          experienceId: record.id,
          principleId,
        })),
      );
    }

    if (input.skillIds.length > 0) {
      await tx.insert(experienceSkills).values(
        input.skillIds.map((skillId) => ({
          experienceId: record.id,
          skillId,
        })),
      );
    }

    if (input.tagIds.length > 0) {
      await tx.insert(experienceTags).values(
        input.tagIds.map((tagId) => ({
          experienceId: record.id,
          tagId,
        })),
      );
    }

    return record.id;
  });
}

export async function createProject(input: CreateProjectInput): Promise<string> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const record = inserted(
      await tx
        .insert(projects)
        .values({
          slug: input.slug,
          name: input.name,
          description: input.description,
          url: input.url,
          githubUrl: input.githubUrl,
          seoTitle: input.seoTitle,
          seoDescription: input.seoDescription,
          ogImage: input.ogImage,
          ...workflowValues(input.status),
          position: input.position,
        })
        .returning({ id: projects.id }),
    );

    if (input.lensIds.length > 0) {
      await tx.insert(projectLenses).values(
        input.lensIds.map((lensId) => ({
          projectId: record.id,
          lensId,
        })),
      );
    }

    if (input.principleIds.length > 0) {
      await tx.insert(projectPrinciples).values(
        input.principleIds.map((principleId) => ({
          projectId: record.id,
          principleId,
        })),
      );
    }

    if (input.skillIds.length > 0) {
      await tx.insert(projectSkills).values(
        input.skillIds.map((skillId) => ({
          projectId: record.id,
          skillId,
        })),
      );
    }

    if (input.tagIds.length > 0) {
      await tx.insert(projectTags).values(
        input.tagIds.map((tagId) => ({
          projectId: record.id,
          tagId,
        })),
      );
    }

    return record.id;
  });
}

export async function createCaseStudy(input: CreateCaseStudyInput): Promise<string> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const record = inserted(
      await tx
        .insert(caseStudies)
        .values({
          slug: input.slug,
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
        .returning({ id: caseStudies.id }),
    );

    if (input.lensIds.length > 0) {
      await tx.insert(caseStudyLenses).values(
        input.lensIds.map((lensId) => ({
          caseStudyId: record.id,
          lensId,
        })),
      );
    }

    if (input.principleIds.length > 0) {
      await tx.insert(caseStudyPrinciples).values(
        input.principleIds.map((principleId) => ({
          caseStudyId: record.id,
          principleId,
        })),
      );
    }

    if (input.experienceIds.length > 0) {
      await tx.insert(caseStudyExperiences).values(
        input.experienceIds.map((experienceId) => ({
          caseStudyId: record.id,
          experienceId,
        })),
      );
    }

    if (input.projectIds.length > 0) {
      await tx.insert(caseStudyProjects).values(
        input.projectIds.map((projectId) => ({
          caseStudyId: record.id,
          projectId,
        })),
      );
    }

    if (input.skillIds.length > 0) {
      await tx.insert(caseStudySkills).values(
        input.skillIds.map((skillId) => ({
          caseStudyId: record.id,
          skillId,
        })),
      );
    }

    if (input.tagIds.length > 0) {
      await tx.insert(caseStudyTags).values(
        input.tagIds.map((tagId) => ({
          caseStudyId: record.id,
          tagId,
        })),
      );
    }

    return record.id;
  });
}

export async function createSkill(input: CreateSkillInput): Promise<string> {
  const record = inserted(
    await getDb()
      .insert(skills)
      .values({ ...input, ...workflowValues(input.status) })
      .returning({ id: skills.id }),
  );

  return record.id;
}

export async function createTag(input: CreateTagInput): Promise<string> {
  const record = inserted(
    await getDb()
      .insert(tags)
      .values({ ...input, ...workflowValues(input.status) })
      .returning({ id: tags.id }),
  );

  return record.id;
}

export async function bulkUpsertSkills(input: BulkSkillsInput): Promise<void> {
  const db = getDb();

  await db.transaction(async (tx) => {
    for (const item of input.items) {
      const [existing] = await tx
        .select({ id: skills.id })
        .from(skills)
        .where(eq(skills.slug, item.slug))
        .limit(1);

      if (existing) {
        await tx
          .update(skills)
          .set({
            name: item.name,
            category: item.category,
            summary: item.summary,
            position: item.position,
            ...workflowUpdate(item.status, skills.publishedAt, skills.archivedAt),
          })
          .where(eq(skills.id, existing.id));
      } else {
        await tx.insert(skills).values({ ...item, ...workflowValues(item.status) });
      }
    }
  });
}

export async function bulkUpsertTags(input: BulkTagsInput): Promise<void> {
  const db = getDb();

  await db.transaction(async (tx) => {
    for (const item of input.items) {
      const [existing] = await tx
        .select({ id: tags.id })
        .from(tags)
        .where(eq(tags.slug, item.slug))
        .limit(1);

      if (existing) {
        await tx
          .update(tags)
          .set({
            name: item.name,
            category: item.category,
            ...workflowUpdate(item.status, tags.publishedAt, tags.archivedAt),
          })
          .where(eq(tags.id, existing.id));
      } else {
        await tx.insert(tags).values({ ...item, ...workflowValues(item.status) });
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Updates. Each replaces the record's scalar columns and, where applicable,
// fully re-writes its relationship rows inside a transaction.
// ---------------------------------------------------------------------------

export async function updateLens(input: UpdateLensInput): Promise<void> {
  await getDb()
    .update(lenses)
    .set({
      slug: input.slug,
      name: input.name,
      summary: input.summary,
      accentColor: input.accentColor,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      ogImage: input.ogImage,
      position: input.position,
      ...workflowUpdate(input.status, lenses.publishedAt, lenses.archivedAt),
    })
    .where(eq(lenses.id, input.id));
}

export async function updatePrinciple(input: UpdatePrincipleInput): Promise<void> {
  await getDb()
    .update(principles)
    .set({
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      body: input.body,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      ogImage: input.ogImage,
      position: input.position,
      ...workflowUpdate(input.status, principles.publishedAt, principles.archivedAt),
    })
    .where(eq(principles.id, input.id));
}

export async function updateSkill(input: UpdateSkillInput): Promise<void> {
  await getDb()
    .update(skills)
    .set({
      slug: input.slug,
      name: input.name,
      category: input.category,
      summary: input.summary,
      position: input.position,
      ...workflowUpdate(input.status, skills.publishedAt, skills.archivedAt),
    })
    .where(eq(skills.id, input.id));
}

export async function updateTag(input: UpdateTagInput): Promise<void> {
  await getDb()
    .update(tags)
    .set({
      slug: input.slug,
      name: input.name,
      category: input.category,
      ...workflowUpdate(input.status, tags.publishedAt, tags.archivedAt),
    })
    .where(eq(tags.id, input.id));
}

export async function updateDecisionPattern(input: UpdateDecisionPatternInput): Promise<void> {
  const db = getDb();

  await db.transaction(async (tx) => {
    await tx
      .update(decisionPatterns)
      .set({
        slug: input.slug,
        title: input.title,
        summary: input.summary,
        body: input.body,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        ogImage: input.ogImage,
        position: input.position,
        ...workflowUpdate(
          input.status,
          decisionPatterns.publishedAt,
          decisionPatterns.archivedAt,
        ),
      })
      .where(eq(decisionPatterns.id, input.id));

    await tx
      .delete(decisionPatternPrinciples)
      .where(eq(decisionPatternPrinciples.decisionPatternId, input.id));

    if (input.principleIds.length > 0) {
      await tx.insert(decisionPatternPrinciples).values(
        input.principleIds.map((principleId) => ({
          decisionPatternId: input.id,
          principleId,
        })),
      );
    }
  });
}

export async function updateExperience(input: UpdateExperienceInput): Promise<void> {
  const db = getDb();

  await db.transaction(async (tx) => {
    await tx
      .update(experiences)
      .set({
        slug: input.slug,
        company: input.company,
        role: input.role,
        location: input.location,
        startDate: input.startDate,
        endDate: input.endDate,
        isCurrent: input.isCurrent,
        summary: input.summary,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        ogImage: input.ogImage,
        ...workflowUpdate(input.status, experiences.publishedAt, experiences.archivedAt),
      })
      .where(eq(experiences.id, input.id));

    await tx.delete(experienceLenses).where(eq(experienceLenses.experienceId, input.id));
    if (input.lensIds.length > 0) {
      await tx.insert(experienceLenses).values(
        input.lensIds.map((lensId) => ({ experienceId: input.id, lensId })),
      );
    }

    await tx.delete(experiencePrinciples).where(eq(experiencePrinciples.experienceId, input.id));
    if (input.principleIds.length > 0) {
      await tx.insert(experiencePrinciples).values(
        input.principleIds.map((principleId) => ({ experienceId: input.id, principleId })),
      );
    }

    await tx.delete(experienceSkills).where(eq(experienceSkills.experienceId, input.id));
    if (input.skillIds.length > 0) {
      await tx.insert(experienceSkills).values(
        input.skillIds.map((skillId) => ({ experienceId: input.id, skillId })),
      );
    }

    await tx.delete(experienceTags).where(eq(experienceTags.experienceId, input.id));
    if (input.tagIds.length > 0) {
      await tx.insert(experienceTags).values(
        input.tagIds.map((tagId) => ({ experienceId: input.id, tagId })),
      );
    }
  });
}

export async function updateProject(input: UpdateProjectInput): Promise<void> {
  const db = getDb();

  await db.transaction(async (tx) => {
    await tx
      .update(projects)
      .set({
        slug: input.slug,
        name: input.name,
        description: input.description,
        url: input.url,
        githubUrl: input.githubUrl,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        ogImage: input.ogImage,
        ...workflowUpdate(input.status, projects.publishedAt, projects.archivedAt),
      })
      .where(eq(projects.id, input.id));

    await tx.delete(projectLenses).where(eq(projectLenses.projectId, input.id));
    if (input.lensIds.length > 0) {
      await tx.insert(projectLenses).values(
        input.lensIds.map((lensId) => ({ projectId: input.id, lensId })),
      );
    }

    await tx.delete(projectPrinciples).where(eq(projectPrinciples.projectId, input.id));
    if (input.principleIds.length > 0) {
      await tx.insert(projectPrinciples).values(
        input.principleIds.map((principleId) => ({ projectId: input.id, principleId })),
      );
    }

    await tx.delete(projectSkills).where(eq(projectSkills.projectId, input.id));
    if (input.skillIds.length > 0) {
      await tx.insert(projectSkills).values(
        input.skillIds.map((skillId) => ({ projectId: input.id, skillId })),
      );
    }

    await tx.delete(projectTags).where(eq(projectTags.projectId, input.id));
    if (input.tagIds.length > 0) {
      await tx.insert(projectTags).values(
        input.tagIds.map((tagId) => ({ projectId: input.id, tagId })),
      );
    }
  });
}

export async function updateCaseStudy(input: UpdateCaseStudyInput): Promise<void> {
  const db = getDb();

  await db.transaction(async (tx) => {
    await tx
      .update(caseStudies)
      .set({
        slug: input.slug,
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
        ...workflowUpdate(input.status, caseStudies.publishedAt, caseStudies.archivedAt),
      })
      .where(eq(caseStudies.id, input.id));

    await tx.delete(caseStudyLenses).where(eq(caseStudyLenses.caseStudyId, input.id));
    if (input.lensIds.length > 0) {
      await tx.insert(caseStudyLenses).values(
        input.lensIds.map((lensId) => ({ caseStudyId: input.id, lensId })),
      );
    }

    await tx.delete(caseStudyPrinciples).where(eq(caseStudyPrinciples.caseStudyId, input.id));
    if (input.principleIds.length > 0) {
      await tx.insert(caseStudyPrinciples).values(
        input.principleIds.map((principleId) => ({ caseStudyId: input.id, principleId })),
      );
    }

    await tx.delete(caseStudyExperiences).where(eq(caseStudyExperiences.caseStudyId, input.id));
    if (input.experienceIds.length > 0) {
      await tx.insert(caseStudyExperiences).values(
        input.experienceIds.map((experienceId) => ({ caseStudyId: input.id, experienceId })),
      );
    }

    await tx.delete(caseStudyProjects).where(eq(caseStudyProjects.caseStudyId, input.id));
    if (input.projectIds.length > 0) {
      await tx.insert(caseStudyProjects).values(
        input.projectIds.map((projectId) => ({ caseStudyId: input.id, projectId })),
      );
    }

    await tx.delete(caseStudySkills).where(eq(caseStudySkills.caseStudyId, input.id));
    if (input.skillIds.length > 0) {
      await tx.insert(caseStudySkills).values(
        input.skillIds.map((skillId) => ({ caseStudyId: input.id, skillId })),
      );
    }

    await tx.delete(caseStudyTags).where(eq(caseStudyTags.caseStudyId, input.id));
    if (input.tagIds.length > 0) {
      await tx.insert(caseStudyTags).values(
        input.tagIds.map((tagId) => ({ caseStudyId: input.id, tagId })),
      );
    }
  });
}

// ---------------------------------------------------------------------------
// Deletes. Join rows are removed automatically via ON DELETE CASCADE.
// ---------------------------------------------------------------------------

export async function deleteLens(id: string): Promise<void> {
  await getDb().delete(lenses).where(eq(lenses.id, id));
}

export async function deletePrinciple(id: string): Promise<void> {
  await getDb().delete(principles).where(eq(principles.id, id));
}

export async function deleteDecisionPattern(id: string): Promise<void> {
  await getDb().delete(decisionPatterns).where(eq(decisionPatterns.id, id));
}

export async function deleteExperience(id: string): Promise<void> {
  await getDb().delete(experiences).where(eq(experiences.id, id));
}

export async function deleteProject(id: string): Promise<void> {
  await getDb().delete(projects).where(eq(projects.id, id));
}

export async function deleteCaseStudy(id: string): Promise<void> {
  await getDb().delete(caseStudies).where(eq(caseStudies.id, id));
}

export async function deleteSkill(id: string): Promise<void> {
  await getDb().delete(skills).where(eq(skills.id, id));
}

export async function deleteTag(id: string): Promise<void> {
  await getDb().delete(tags).where(eq(tags.id, id));
}
