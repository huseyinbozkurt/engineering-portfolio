import { desc, eq, inArray, sql } from "drizzle-orm";
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
  ContactProfile,
  HomepageSettings,
  SiteSettings,
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
  contactProfiles,
  decisionPatternPrinciples,
  decisionPatterns,
  experienceLenses,
  experiencePrinciples,
  experienceSkills,
  experienceTags,
  experiences,
  homepageSettings,
  lenses,
  principles,
  projectLenses,
  projectPrinciples,
  projectSkills,
  projectTags,
  projects,
  siteImages,
  siteSettings,
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
          details: input.details,
          awards: input.awards,
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
          details: input.details,
          architecture: input.architecture,
          developmentTechStack: input.developmentTechStack,
          qaTechStack: input.qaTechStack,
          aiIntegrationTechStack: input.aiIntegrationTechStack,
          deploymentTechStack: input.deploymentTechStack,
          url: input.url,
          githubUrl: input.githubUrl,
          portfolioVisibility: input.portfolioVisibility,
          featured: input.featured,
          projectType: input.projectType,
          projectStatus: input.projectStatus,
          projectRole: input.projectRole,
          confidentiality: input.confidentiality,
          ownership: input.ownership,
          teamSize: input.teamSize,
          durationMonths: input.durationMonths,
          motivation: input.motivation,
          problem: input.problem,
          constraints: input.constraints,
          tradeOffs: input.tradeOffs,
          whatILearned: input.whatILearned,
          contributions: input.contributions,
          decisions: input.decisions,
          outcomes: input.outcomes,
          metrics: input.metrics,
          evidence: input.evidence,
          engineeringSignals: input.engineeringSignals,
          projectSignals: input.projectSignals,
          sourceAvailability: input.sourceAvailability,
          repositoryUrl: input.repositoryUrl,
          releaseStatus: input.releaseStatus,
          demoUrl: input.demoUrl,
          startDate: input.startDate,
          endDate: input.endDate,
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

export async function upsertContactProfile(input: ContactProfile): Promise<string> {
  const db = getDb();
  const [existing] = await db
    .select({ id: contactProfiles.id })
    .from(contactProfiles)
    .orderBy(desc(contactProfiles.updatedAt), desc(contactProfiles.createdAt))
    .limit(1);

  if (existing) {
    await db
      .update(contactProfiles)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(contactProfiles.id, existing.id));

    return existing.id;
  }

  const record = inserted(
    await db.insert(contactProfiles).values(input).returning({ id: contactProfiles.id }),
  );

  return record.id;
}

interface SiteImageInput {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  data: Buffer;
}

interface UpsertSiteSettingsOptions {
  brandLogoImage?: SiteImageInput | undefined;
  removeBrandLogoImage?: boolean | undefined;
}

export async function upsertSiteSettings(
  input: SiteSettings,
  options: UpsertSiteSettingsOptions = {},
): Promise<string> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: siteSettings.id, brandLogoImageId: siteSettings.brandLogoImageId })
      .from(siteSettings)
      .orderBy(desc(siteSettings.updatedAt), desc(siteSettings.createdAt))
      .limit(1);

    let nextBrandLogoImageId = input.brandLogoImageId;

    if (options.brandLogoImage) {
      const [image] = await tx
        .insert(siteImages)
        .values(options.brandLogoImage)
        .returning({ id: siteImages.id });

      if (!image) {
        throw new Error("Failed to store the brand logo image.");
      }

      nextBrandLogoImageId = image.id;
    } else if (options.removeBrandLogoImage) {
      nextBrandLogoImageId = null;
    }

    const values = {
      ...input,
      brandLogoImageId: nextBrandLogoImageId,
      updatedAt: new Date(),
    };

    if (existing) {
      await tx.update(siteSettings).set(values).where(eq(siteSettings.id, existing.id));

      if (
        existing.brandLogoImageId &&
        existing.brandLogoImageId !== nextBrandLogoImageId &&
        (options.brandLogoImage || options.removeBrandLogoImage)
      ) {
        await tx.delete(siteImages).where(eq(siteImages.id, existing.brandLogoImageId));
      }

      return existing.id;
    }

    const record = inserted(
      await tx.insert(siteSettings).values(values).returning({ id: siteSettings.id }),
    );

    return record.id;
  });
}

export async function upsertHomepageSettings(input: HomepageSettings): Promise<string> {
  const db = getDb();
  const [existing] = await db
    .select({ id: homepageSettings.id })
    .from(homepageSettings)
    .orderBy(desc(homepageSettings.updatedAt), desc(homepageSettings.createdAt))
    .limit(1);

  const values = {
    ...input,
    updatedAt: new Date(),
  };

  if (existing) {
    await db.update(homepageSettings).set(values).where(eq(homepageSettings.id, existing.id));

    return existing.id;
  }

  const record = inserted(
    await db.insert(homepageSettings).values(input).returning({ id: homepageSettings.id }),
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
        details: input.details,
        awards: input.awards,
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
        details: input.details,
        architecture: input.architecture,
        developmentTechStack: input.developmentTechStack,
        qaTechStack: input.qaTechStack,
        aiIntegrationTechStack: input.aiIntegrationTechStack,
        deploymentTechStack: input.deploymentTechStack,
        url: input.url,
        githubUrl: input.githubUrl,
        portfolioVisibility: input.portfolioVisibility,
        featured: input.featured,
        projectType: input.projectType,
        projectStatus: input.projectStatus,
        projectRole: input.projectRole,
        confidentiality: input.confidentiality,
        ownership: input.ownership,
        teamSize: input.teamSize,
        durationMonths: input.durationMonths,
        motivation: input.motivation,
        problem: input.problem,
        constraints: input.constraints,
        tradeOffs: input.tradeOffs,
        whatILearned: input.whatILearned,
        contributions: input.contributions,
        decisions: input.decisions,
        outcomes: input.outcomes,
        metrics: input.metrics,
        evidence: input.evidence,
        engineeringSignals: input.engineeringSignals,
        projectSignals: input.projectSignals,
        sourceAvailability: input.sourceAvailability,
        repositoryUrl: input.repositoryUrl,
        releaseStatus: input.releaseStatus,
        demoUrl: input.demoUrl,
        startDate: input.startDate,
        endDate: input.endDate,
        experienceId: input.experienceId,
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
// Patches. Partial updates that power per-section ("inline") editing in the
// admin: only the scalar columns actually provided are written, and a relation
// join table is re-written only when its id array is passed. This lets a single
// section save (e.g. just a project's "Details") leave every other field and
// relationship untouched, unlike the wholesale `update*` functions above.
// ---------------------------------------------------------------------------

/** Drop keys whose value is `undefined` so only provided columns are written. */
function definedColumns<T extends Record<string, unknown>>(columns: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(columns).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

export async function patchLens(input: {
  id: string;
  set: Partial<CreateLensInput>;
}): Promise<void> {
  const { id, set } = input;
  const { status } = set;
  const columns = definedColumns({
    slug: set.slug,
    name: set.name,
    summary: set.summary,
    accentColor: set.accentColor,
    seoTitle: set.seoTitle,
    seoDescription: set.seoDescription,
    ogImage: set.ogImage,
    position: set.position,
  });

  if (Object.keys(columns).length === 0 && status === undefined) {
    return;
  }

  await getDb()
    .update(lenses)
    .set(
      status !== undefined
        ? { ...columns, ...workflowUpdate(status, lenses.publishedAt, lenses.archivedAt) }
        : { ...columns, updatedAt: new Date() },
    )
    .where(eq(lenses.id, id));
}

export async function patchPrinciple(input: {
  id: string;
  set: Partial<CreatePrincipleInput>;
}): Promise<void> {
  const { id, set } = input;
  const { status } = set;
  const columns = definedColumns({
    slug: set.slug,
    title: set.title,
    summary: set.summary,
    body: set.body,
    seoTitle: set.seoTitle,
    seoDescription: set.seoDescription,
    ogImage: set.ogImage,
    position: set.position,
  });

  if (Object.keys(columns).length === 0 && status === undefined) {
    return;
  }

  await getDb()
    .update(principles)
    .set(
      status !== undefined
        ? { ...columns, ...workflowUpdate(status, principles.publishedAt, principles.archivedAt) }
        : { ...columns, updatedAt: new Date() },
    )
    .where(eq(principles.id, id));
}

export async function patchSkill(input: {
  id: string;
  set: Partial<CreateSkillInput>;
}): Promise<void> {
  const { id, set } = input;
  const { status } = set;
  const columns = definedColumns({
    slug: set.slug,
    name: set.name,
    category: set.category,
    summary: set.summary,
    position: set.position,
  });

  if (Object.keys(columns).length === 0 && status === undefined) {
    return;
  }

  await getDb()
    .update(skills)
    .set(
      status !== undefined
        ? { ...columns, ...workflowUpdate(status, skills.publishedAt, skills.archivedAt) }
        : { ...columns, updatedAt: new Date() },
    )
    .where(eq(skills.id, id));
}

export async function patchTag(input: {
  id: string;
  set: Partial<CreateTagInput>;
}): Promise<void> {
  const { id, set } = input;
  const { status } = set;
  const columns = definedColumns({
    slug: set.slug,
    name: set.name,
    category: set.category,
  });

  if (Object.keys(columns).length === 0 && status === undefined) {
    return;
  }

  await getDb()
    .update(tags)
    .set(
      status !== undefined
        ? { ...columns, ...workflowUpdate(status, tags.publishedAt, tags.archivedAt) }
        : { ...columns, updatedAt: new Date() },
    )
    .where(eq(tags.id, id));
}

export async function patchDecisionPattern(input: {
  id: string;
  set: Partial<CreateDecisionPatternInput>;
  relations?: { principleIds?: string[] };
}): Promise<void> {
  const { id, set, relations = {} } = input;
  const { status } = set;
  const columns = definedColumns({
    slug: set.slug,
    title: set.title,
    summary: set.summary,
    body: set.body,
    seoTitle: set.seoTitle,
    seoDescription: set.seoDescription,
    ogImage: set.ogImage,
    position: set.position,
  });

  await getDb().transaction(async (tx) => {
    if (Object.keys(columns).length > 0 || status !== undefined) {
      await tx
        .update(decisionPatterns)
        .set(
          status !== undefined
            ? {
                ...columns,
                ...workflowUpdate(status, decisionPatterns.publishedAt, decisionPatterns.archivedAt),
              }
            : { ...columns, updatedAt: new Date() },
        )
        .where(eq(decisionPatterns.id, id));
    }

    if (relations.principleIds) {
      await tx
        .delete(decisionPatternPrinciples)
        .where(eq(decisionPatternPrinciples.decisionPatternId, id));
      if (relations.principleIds.length > 0) {
        await tx.insert(decisionPatternPrinciples).values(
          relations.principleIds.map((principleId) => ({ decisionPatternId: id, principleId })),
        );
      }
    }
  });
}

export async function patchExperience(input: {
  id: string;
  set: Partial<CreateExperienceInput>;
  relations?: { lensIds?: string[]; principleIds?: string[]; skillIds?: string[]; tagIds?: string[] };
}): Promise<void> {
  const { id, set, relations = {} } = input;
  const { status } = set;
  const columns = definedColumns({
    slug: set.slug,
    company: set.company,
    role: set.role,
    location: set.location,
    startDate: set.startDate,
    endDate: set.endDate,
    isCurrent: set.isCurrent,
    summary: set.summary,
    details: set.details,
    awards: set.awards,
    seoTitle: set.seoTitle,
    seoDescription: set.seoDescription,
    ogImage: set.ogImage,
    position: set.position,
  });

  await getDb().transaction(async (tx) => {
    if (Object.keys(columns).length > 0 || status !== undefined) {
      await tx
        .update(experiences)
        .set(
          status !== undefined
            ? { ...columns, ...workflowUpdate(status, experiences.publishedAt, experiences.archivedAt) }
            : { ...columns, updatedAt: new Date() },
        )
        .where(eq(experiences.id, id));
    }

    if (relations.lensIds) {
      await tx.delete(experienceLenses).where(eq(experienceLenses.experienceId, id));
      if (relations.lensIds.length > 0) {
        await tx.insert(experienceLenses).values(
          relations.lensIds.map((lensId) => ({ experienceId: id, lensId })),
        );
      }
    }

    if (relations.principleIds) {
      await tx.delete(experiencePrinciples).where(eq(experiencePrinciples.experienceId, id));
      if (relations.principleIds.length > 0) {
        await tx.insert(experiencePrinciples).values(
          relations.principleIds.map((principleId) => ({ experienceId: id, principleId })),
        );
      }
    }

    if (relations.skillIds) {
      await tx.delete(experienceSkills).where(eq(experienceSkills.experienceId, id));
      if (relations.skillIds.length > 0) {
        await tx.insert(experienceSkills).values(
          relations.skillIds.map((skillId) => ({ experienceId: id, skillId })),
        );
      }
    }

    if (relations.tagIds) {
      await tx.delete(experienceTags).where(eq(experienceTags.experienceId, id));
      if (relations.tagIds.length > 0) {
        await tx.insert(experienceTags).values(
          relations.tagIds.map((tagId) => ({ experienceId: id, tagId })),
        );
      }
    }
  });
}

export async function patchProject(input: {
  id: string;
  set: Partial<CreateProjectInput>;
  relations?: { lensIds?: string[]; principleIds?: string[]; skillIds?: string[]; tagIds?: string[] };
}): Promise<void> {
  const { id, set, relations = {} } = input;
  const { status } = set;
  const columns = definedColumns({
    slug: set.slug,
    name: set.name,
    description: set.description,
    details: set.details,
    architecture: set.architecture,
    developmentTechStack: set.developmentTechStack,
    qaTechStack: set.qaTechStack,
    aiIntegrationTechStack: set.aiIntegrationTechStack,
    deploymentTechStack: set.deploymentTechStack,
    url: set.url,
    githubUrl: set.githubUrl,
    portfolioVisibility: set.portfolioVisibility,
    featured: set.featured,
    projectType: set.projectType,
    projectStatus: set.projectStatus,
    projectRole: set.projectRole,
    confidentiality: set.confidentiality,
    ownership: set.ownership,
    teamSize: set.teamSize,
    durationMonths: set.durationMonths,
    motivation: set.motivation,
    problem: set.problem,
    constraints: set.constraints,
    tradeOffs: set.tradeOffs,
    whatILearned: set.whatILearned,
    contributions: set.contributions,
    decisions: set.decisions,
    outcomes: set.outcomes,
    metrics: set.metrics,
    evidence: set.evidence,
    engineeringSignals: set.engineeringSignals,
    projectSignals: set.projectSignals,
    sourceAvailability: set.sourceAvailability,
    repositoryUrl: set.repositoryUrl,
    releaseStatus: set.releaseStatus,
    demoUrl: set.demoUrl,
    startDate: set.startDate,
    endDate: set.endDate,
    experienceId: set.experienceId,
    seoTitle: set.seoTitle,
    seoDescription: set.seoDescription,
    ogImage: set.ogImage,
    position: set.position,
  });

  await getDb().transaction(async (tx) => {
    if (Object.keys(columns).length > 0 || status !== undefined) {
      await tx
        .update(projects)
        .set(
          status !== undefined
            ? { ...columns, ...workflowUpdate(status, projects.publishedAt, projects.archivedAt) }
            : { ...columns, updatedAt: new Date() },
        )
        .where(eq(projects.id, id));
    }

    if (relations.lensIds) {
      await tx.delete(projectLenses).where(eq(projectLenses.projectId, id));
      if (relations.lensIds.length > 0) {
        await tx.insert(projectLenses).values(
          relations.lensIds.map((lensId) => ({ projectId: id, lensId })),
        );
      }
    }

    if (relations.principleIds) {
      await tx.delete(projectPrinciples).where(eq(projectPrinciples.projectId, id));
      if (relations.principleIds.length > 0) {
        await tx.insert(projectPrinciples).values(
          relations.principleIds.map((principleId) => ({ projectId: id, principleId })),
        );
      }
    }

    if (relations.skillIds) {
      await tx.delete(projectSkills).where(eq(projectSkills.projectId, id));
      if (relations.skillIds.length > 0) {
        await tx.insert(projectSkills).values(
          relations.skillIds.map((skillId) => ({ projectId: id, skillId })),
        );
      }
    }

    if (relations.tagIds) {
      await tx.delete(projectTags).where(eq(projectTags.projectId, id));
      if (relations.tagIds.length > 0) {
        await tx.insert(projectTags).values(
          relations.tagIds.map((tagId) => ({ projectId: id, tagId })),
        );
      }
    }
  });
}

export async function patchCaseStudy(input: {
  id: string;
  set: Partial<CreateCaseStudyInput>;
  relations?: {
    lensIds?: string[];
    principleIds?: string[];
    experienceIds?: string[];
    projectIds?: string[];
    skillIds?: string[];
    tagIds?: string[];
  };
}): Promise<void> {
  const { id, set, relations = {} } = input;
  const { status } = set;
  const columns = definedColumns({
    slug: set.slug,
    title: set.title,
    excerpt: set.excerpt,
    context: set.context,
    problem: set.problem,
    constraints: set.constraints,
    action: set.action,
    tradeoffs: set.tradeoffs,
    outcome: set.outcome,
    learning: set.learning,
    seoTitle: set.seoTitle,
    seoDescription: set.seoDescription,
    ogImage: set.ogImage,
    position: set.position,
  });

  await getDb().transaction(async (tx) => {
    if (Object.keys(columns).length > 0 || status !== undefined) {
      await tx
        .update(caseStudies)
        .set(
          status !== undefined
            ? { ...columns, ...workflowUpdate(status, caseStudies.publishedAt, caseStudies.archivedAt) }
            : { ...columns, updatedAt: new Date() },
        )
        .where(eq(caseStudies.id, id));
    }

    if (relations.lensIds) {
      await tx.delete(caseStudyLenses).where(eq(caseStudyLenses.caseStudyId, id));
      if (relations.lensIds.length > 0) {
        await tx.insert(caseStudyLenses).values(
          relations.lensIds.map((lensId) => ({ caseStudyId: id, lensId })),
        );
      }
    }

    if (relations.principleIds) {
      await tx.delete(caseStudyPrinciples).where(eq(caseStudyPrinciples.caseStudyId, id));
      if (relations.principleIds.length > 0) {
        await tx.insert(caseStudyPrinciples).values(
          relations.principleIds.map((principleId) => ({ caseStudyId: id, principleId })),
        );
      }
    }

    if (relations.experienceIds) {
      await tx.delete(caseStudyExperiences).where(eq(caseStudyExperiences.caseStudyId, id));
      if (relations.experienceIds.length > 0) {
        await tx.insert(caseStudyExperiences).values(
          relations.experienceIds.map((experienceId) => ({ caseStudyId: id, experienceId })),
        );
      }
    }

    if (relations.projectIds) {
      await tx.delete(caseStudyProjects).where(eq(caseStudyProjects.caseStudyId, id));
      if (relations.projectIds.length > 0) {
        await tx.insert(caseStudyProjects).values(
          relations.projectIds.map((projectId) => ({ caseStudyId: id, projectId })),
        );
      }
    }

    if (relations.skillIds) {
      await tx.delete(caseStudySkills).where(eq(caseStudySkills.caseStudyId, id));
      if (relations.skillIds.length > 0) {
        await tx.insert(caseStudySkills).values(
          relations.skillIds.map((skillId) => ({ caseStudyId: id, skillId })),
        );
      }
    }

    if (relations.tagIds) {
      await tx.delete(caseStudyTags).where(eq(caseStudyTags.caseStudyId, id));
      if (relations.tagIds.length > 0) {
        await tx.insert(caseStudyTags).values(
          relations.tagIds.map((tagId) => ({ caseStudyId: id, tagId })),
        );
      }
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

export async function deleteSkills(ids: string[]): Promise<void> {
  if (ids.length === 0) {
    return;
  }

  await getDb().delete(skills).where(inArray(skills.id, ids));
}

export async function deleteTag(id: string): Promise<void> {
  await getDb().delete(tags).where(eq(tags.id, id));
}
