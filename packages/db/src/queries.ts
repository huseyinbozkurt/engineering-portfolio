import { and, asc, desc, eq, inArray, or, sql, type InferSelectModel } from "drizzle-orm";

import { getDb, hasDatabaseUrl, verifyInitialDbConnection, type PortfolioDb } from "./client";
import {
  aiReviewQualitySnapshots,
  caseStudies,
  caseStudyExperiences,
  caseStudyLenses,
  caseStudyPrinciples,
  caseStudyProjects,
  caseStudySkills,
  caseStudyTags,
  contactSubmissions,
  contactProfiles,
  decisionPatternPrinciples,
  decisionPatterns,
  experienceLenses,
  experiencePrinciples,
  experiences,
  experienceSkills,
  experienceTags,
  homepageSettings,
  lenses,
  principles,
  projectLenses,
  projectPrinciples,
  projects,
  projectSkills,
  projectTags,
  skills,
  tags,
} from "./schema";

export type LensRecord = InferSelectModel<typeof lenses>;
export type PrincipleRecord = InferSelectModel<typeof principles>;
export type DecisionPatternRecord = InferSelectModel<typeof decisionPatterns>;
export type ExperienceRecord = InferSelectModel<typeof experiences>;
export type ProjectRecord = InferSelectModel<typeof projects>;
export type CaseStudyRecord = InferSelectModel<typeof caseStudies>;
export type SkillRecord = InferSelectModel<typeof skills>;
export type TagRecord = InferSelectModel<typeof tags>;
export type ContactSubmissionRecord = InferSelectModel<typeof contactSubmissions>;
export type ContactProfileRecord = InferSelectModel<typeof contactProfiles>;
export type HomepageSettingsRecord = InferSelectModel<typeof homepageSettings>;
export type AiReviewQualitySnapshotRecord = InferSelectModel<typeof aiReviewQualitySnapshots>;

// Admin "edit" records bundle a single entity with the ids of its current
// relationships so an edit form can pre-select the related checkboxes.
export interface DecisionPatternEditRecord extends DecisionPatternRecord {
  principleIds: string[];
}

export interface ExperienceEditRecord extends ExperienceRecord {
  lensIds: string[];
  principleIds: string[];
  skillIds: string[];
  tagIds: string[];
}

export type ExperienceListRecord = ExperienceEditRecord;
export type ProjectListRecord = ProjectEditRecord;
export type CaseStudyListRecord = CaseStudyEditRecord;

export interface ProjectEditRecord extends ProjectRecord {
  lensIds: string[];
  principleIds: string[];
  skillIds: string[];
  tagIds: string[];
}

export interface CaseStudyEditRecord extends CaseStudyRecord {
  lensIds: string[];
  principleIds: string[];
  experienceIds: string[];
  projectIds: string[];
  skillIds: string[];
  tagIds: string[];
}

export interface HomeContentRecord {
  lenses: LensRecord[];
  principles: PrincipleRecord[];
  decisionPatterns: DecisionPatternRecord[];
  experiences: ExperienceRecord[];
  projects: ProjectRecord[];
  caseStudies: CaseStudyRecord[];
  skills: SkillRecord[];
  homepageSettings: HomepageSettingsRecord | null;
}

export interface CaseStudyDetailRecord {
  caseStudy: CaseStudyRecord;
  lenses: LensRecord[];
  principles: PrincipleRecord[];
  experiences: ExperienceRecord[];
  projects: ProjectRecord[];
  skills: SkillRecord[];
  tags: TagRecord[];
}

export interface LensDetailRecord {
  lens: LensRecord;
  caseStudies: CaseStudyRecord[];
  experiences: ExperienceRecord[];
  projects: ProjectRecord[];
  principles: PrincipleRecord[];
}

export interface ExperienceDetailRecord {
  experience: ExperienceRecord;
  lenses: LensRecord[];
  principles: PrincipleRecord[];
  caseStudies: CaseStudyRecord[];
  projects: ProjectRecord[];
  skills: SkillRecord[];
  tags: TagRecord[];
}

export interface ProjectDetailRecord {
  project: ProjectRecord;
  experience: ExperienceRecord | null;
  lenses: LensRecord[];
  principles: PrincipleRecord[];
  skills: SkillRecord[];
  tags: TagRecord[];
  caseStudies: CaseStudyRecord[];
}

export interface AdminContentIndexRecord extends Omit<HomeContentRecord, "homepageSettings"> {
  skills: SkillRecord[];
  tags: TagRecord[];
}

// A missing DATABASE_URL or a failed connection are treated the same way: the
// site has nothing to render, so reads resolve to "empty" rather than throwing.
// This is what lets the public site fall back to a single "Coming Soon" landing
// page (whole DB empty or unreachable) instead of crashing on every route.
async function readArray<T>(reader: (db: PortfolioDb) => Promise<T[]>): Promise<T[]> {
  if (!hasDatabaseUrl()) {
    return [];
  }

  try {
    return await reader(getDb());
  } catch (error) {
    console.error("[db] read failed; treating as empty:", error);
    return [];
  }
}

async function readOne<T>(reader: (db: PortfolioDb) => Promise<T | undefined>): Promise<T | null> {
  if (!hasDatabaseUrl()) {
    return null;
  }

  try {
    return (await reader(getDb())) ?? null;
  } catch (error) {
    console.error("[db] read failed; treating as missing:", error);
    return null;
  }
}

// Admin-facing list queries return every status (draft, published, archived).
// Their `getPublished*` counterparts below restrict to published content and
// power the public site, where drafts and archived records must never appear.

export async function getLenses(): Promise<LensRecord[]> {
  return readArray((db) =>
    db.select().from(lenses).orderBy(asc(lenses.position), asc(lenses.name)),
  );
}

export async function getPublishedLenses(): Promise<LensRecord[]> {
  return readArray((db) =>
    db
      .select()
      .from(lenses)
      .where(eq(lenses.status, "published"))
      .orderBy(asc(lenses.position), asc(lenses.name)),
  );
}

export async function getPrinciples(): Promise<PrincipleRecord[]> {
  return readArray((db) =>
    db.select().from(principles).orderBy(asc(principles.position), asc(principles.title)),
  );
}

export async function getPublishedPrinciples(): Promise<PrincipleRecord[]> {
  return readArray((db) =>
    db
      .select()
      .from(principles)
      .where(eq(principles.status, "published"))
      .orderBy(asc(principles.position), asc(principles.title)),
  );
}

export async function getDecisionPatterns(): Promise<DecisionPatternRecord[]> {
  return readArray((db) =>
    db
      .select()
      .from(decisionPatterns)
      .orderBy(asc(decisionPatterns.position), asc(decisionPatterns.title)),
  );
}

export async function getPublishedDecisionPatterns(): Promise<DecisionPatternRecord[]> {
  return readArray((db) =>
    db
      .select()
      .from(decisionPatterns)
      .where(eq(decisionPatterns.status, "published"))
      .orderBy(asc(decisionPatterns.position), asc(decisionPatterns.title)),
  );
}

export async function getExperiences(): Promise<ExperienceRecord[]> {
  return readArray((db) =>
    db
      .select()
      .from(experiences)
      .orderBy(...reverseChronologicalExperienceOrder()),
  );
}

export async function getExperienceListRecords(): Promise<ExperienceListRecord[]> {
  return readArray(async (db) => {
    const records = await db
      .select()
      .from(experiences)
      .orderBy(...reverseChronologicalExperienceOrder());

    if (records.length === 0) {
      return [];
    }

    const recordIds = records.map((record) => record.id);
    const [lensRows, principleRows, skillRows, tagRows] = await Promise.all([
      db
        .select({ ownerId: experienceLenses.experienceId, id: experienceLenses.lensId })
        .from(experienceLenses)
        .where(inArray(experienceLenses.experienceId, recordIds)),
      db
        .select({
          ownerId: experiencePrinciples.experienceId,
          id: experiencePrinciples.principleId,
        })
        .from(experiencePrinciples)
        .where(inArray(experiencePrinciples.experienceId, recordIds)),
      db
        .select({ ownerId: experienceSkills.experienceId, id: experienceSkills.skillId })
        .from(experienceSkills)
        .where(inArray(experienceSkills.experienceId, recordIds)),
      db
        .select({ ownerId: experienceTags.experienceId, id: experienceTags.tagId })
        .from(experienceTags)
        .where(inArray(experienceTags.experienceId, recordIds)),
    ]);

    const lensesByExperience = groupRelationIds(lensRows);
    const principlesByExperience = groupRelationIds(principleRows);
    const skillsByExperience = groupRelationIds(skillRows);
    const tagsByExperience = groupRelationIds(tagRows);

    return records.map((record) => ({
      ...record,
      lensIds: lensesByExperience.get(record.id) ?? [],
      principleIds: principlesByExperience.get(record.id) ?? [],
      skillIds: skillsByExperience.get(record.id) ?? [],
      tagIds: tagsByExperience.get(record.id) ?? [],
    }));
  });
}

export async function getPublishedExperiences(): Promise<ExperienceRecord[]> {
  return readArray((db) =>
    db
      .select()
      .from(experiences)
      .where(eq(experiences.status, "published"))
      .orderBy(...reverseChronologicalExperienceOrder()),
  );
}

export async function getPublishedProjects(): Promise<ProjectRecord[]> {
  return readArray((db) =>
    db
      .select()
      .from(projects)
      .where(and(eq(projects.status, "published"), eq(projects.visibility, "public")))
      .orderBy(desc(projects.featured), asc(projects.position), asc(projects.name)),
  );
}

export async function getPublishedCaseStudies(): Promise<CaseStudyRecord[]> {
  return readArray((db) =>
    db
      .select()
      .from(caseStudies)
      .where(eq(caseStudies.status, "published"))
      .orderBy(asc(caseStudies.position), desc(caseStudies.publishedAt), desc(caseStudies.createdAt)),
  );
}

export async function getPublishedSkills(): Promise<SkillRecord[]> {
  return readArray((db) =>
    db
      .select()
      .from(skills)
      .where(eq(skills.status, "published"))
      .orderBy(sql`${skills.category} asc nulls last`, asc(skills.position), asc(skills.name)),
  );
}

export async function getHomeContent(): Promise<HomeContentRecord> {
  const [
    lensRows,
    principleRows,
    decisionPatternRows,
    experienceRows,
    projectRows,
    caseStudyRows,
    skillRows,
    homepageSettingsRow,
  ] = await Promise.all([
    getPublishedLenses(),
    getPublishedPrinciples(),
    getPublishedDecisionPatterns(),
    getPublishedExperiences(),
    getPublishedProjects(),
    getPublishedCaseStudies(),
    getPublishedSkills(),
    getHomepageSettings(),
  ]);

  return {
    lenses: lensRows,
    principles: principleRows,
    decisionPatterns: decisionPatternRows,
    experiences: experienceRows,
    projects: projectRows,
    caseStudies: caseStudyRows,
    skills: skillRows,
    homepageSettings: homepageSettingsRow,
  };
}

export async function getAllProjects(): Promise<ProjectRecord[]> {
  return readArray((db) =>
    db.select().from(projects).orderBy(asc(projects.position), asc(projects.name)),
  );
}

export async function getProjectListRecords(): Promise<ProjectListRecord[]> {
  return readArray(async (db) => {
    const records = await db
      .select()
      .from(projects)
      .orderBy(asc(projects.position), asc(projects.name));

    if (records.length === 0) {
      return [];
    }

    const recordIds = records.map((record) => record.id);
    const [lensRows, principleRows, skillRows, tagRows] = await Promise.all([
      db
        .select({ ownerId: projectLenses.projectId, id: projectLenses.lensId })
        .from(projectLenses)
        .where(inArray(projectLenses.projectId, recordIds)),
      db
        .select({ ownerId: projectPrinciples.projectId, id: projectPrinciples.principleId })
        .from(projectPrinciples)
        .where(inArray(projectPrinciples.projectId, recordIds)),
      db
        .select({ ownerId: projectSkills.projectId, id: projectSkills.skillId })
        .from(projectSkills)
        .where(inArray(projectSkills.projectId, recordIds)),
      db
        .select({ ownerId: projectTags.projectId, id: projectTags.tagId })
        .from(projectTags)
        .where(inArray(projectTags.projectId, recordIds)),
    ]);

    const lensesByProject = groupRelationIds(lensRows);
    const principlesByProject = groupRelationIds(principleRows);
    const skillsByProject = groupRelationIds(skillRows);
    const tagsByProject = groupRelationIds(tagRows);

    return records.map((record) => ({
      ...record,
      lensIds: lensesByProject.get(record.id) ?? [],
      principleIds: principlesByProject.get(record.id) ?? [],
      skillIds: skillsByProject.get(record.id) ?? [],
      tagIds: tagsByProject.get(record.id) ?? [],
    }));
  });
}

export async function getAllCaseStudies(): Promise<CaseStudyRecord[]> {
  return readArray((db) =>
    db.select().from(caseStudies).orderBy(asc(caseStudies.position), asc(caseStudies.title)),
  );
}

export async function getCaseStudyListRecords(): Promise<CaseStudyListRecord[]> {
  return readArray(async (db) => {
    const records = await db
      .select()
      .from(caseStudies)
      .orderBy(asc(caseStudies.position), asc(caseStudies.title));

    if (records.length === 0) {
      return [];
    }

    const recordIds = records.map((record) => record.id);
    const [lensRows, principleRows, experienceRows, projectRows, skillRows, tagRows] =
      await Promise.all([
        db
          .select({ ownerId: caseStudyLenses.caseStudyId, id: caseStudyLenses.lensId })
          .from(caseStudyLenses)
          .where(inArray(caseStudyLenses.caseStudyId, recordIds)),
        db
          .select({ ownerId: caseStudyPrinciples.caseStudyId, id: caseStudyPrinciples.principleId })
          .from(caseStudyPrinciples)
          .where(inArray(caseStudyPrinciples.caseStudyId, recordIds)),
        db
          .select({ ownerId: caseStudyExperiences.caseStudyId, id: caseStudyExperiences.experienceId })
          .from(caseStudyExperiences)
          .where(inArray(caseStudyExperiences.caseStudyId, recordIds)),
        db
          .select({ ownerId: caseStudyProjects.caseStudyId, id: caseStudyProjects.projectId })
          .from(caseStudyProjects)
          .where(inArray(caseStudyProjects.caseStudyId, recordIds)),
        db
          .select({ ownerId: caseStudySkills.caseStudyId, id: caseStudySkills.skillId })
          .from(caseStudySkills)
          .where(inArray(caseStudySkills.caseStudyId, recordIds)),
        db
          .select({ ownerId: caseStudyTags.caseStudyId, id: caseStudyTags.tagId })
          .from(caseStudyTags)
          .where(inArray(caseStudyTags.caseStudyId, recordIds)),
      ]);

    const lensesByCaseStudy = groupRelationIds(lensRows);
    const principlesByCaseStudy = groupRelationIds(principleRows);
    const experiencesByCaseStudy = groupRelationIds(experienceRows);
    const projectsByCaseStudy = groupRelationIds(projectRows);
    const skillsByCaseStudy = groupRelationIds(skillRows);
    const tagsByCaseStudy = groupRelationIds(tagRows);

    return records.map((record) => ({
      ...record,
      lensIds: lensesByCaseStudy.get(record.id) ?? [],
      principleIds: principlesByCaseStudy.get(record.id) ?? [],
      experienceIds: experiencesByCaseStudy.get(record.id) ?? [],
      projectIds: projectsByCaseStudy.get(record.id) ?? [],
      skillIds: skillsByCaseStudy.get(record.id) ?? [],
      tagIds: tagsByCaseStudy.get(record.id) ?? [],
    }));
  });
}

export async function getSkills(): Promise<SkillRecord[]> {
  return readArray((db) =>
    db
      .select()
      .from(skills)
      .orderBy(sql`${skills.category} asc nulls last`, asc(skills.position), asc(skills.name)),
  );
}

export async function getTags(): Promise<TagRecord[]> {
  return readArray((db) =>
    db.select().from(tags).orderBy(sql`${tags.category} asc nulls last`, asc(tags.name)),
  );
}

export async function getAdminContentIndex(): Promise<AdminContentIndexRecord> {
  const [
    lensRows,
    principleRows,
    decisionPatternRows,
    experienceRows,
    projectRows,
    caseStudyRows,
    skillRows,
    tagRows,
  ] = await Promise.all([
    getLenses(),
    getPrinciples(),
    getDecisionPatterns(),
    getExperiences(),
    getAllProjects(),
    getAllCaseStudies(),
    getSkills(),
    getTags(),
  ]);

  return {
    lenses: lensRows,
    principles: principleRows,
    decisionPatterns: decisionPatternRows,
    experiences: experienceRows,
    projects: projectRows,
    caseStudies: caseStudyRows,
    skills: skillRows,
    tags: tagRows,
  };
}

export async function getContactSubmissions(): Promise<ContactSubmissionRecord[]> {
  return readArray((db) =>
    db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt)),
  );
}

export async function getContactProfile(): Promise<ContactProfileRecord | null> {
  return readOne(async (db) => {
    const [profile] = await db
      .select()
      .from(contactProfiles)
      .orderBy(desc(contactProfiles.updatedAt), desc(contactProfiles.createdAt))
      .limit(1);

    return profile;
  });
}

export async function getHomepageSettings(): Promise<HomepageSettingsRecord | null> {
  return readOne(async (db) => {
    const [settings] = await db
      .select()
      .from(homepageSettings)
      .orderBy(desc(homepageSettings.updatedAt), desc(homepageSettings.createdAt))
      .limit(1);

    return settings;
  });
}

export async function getAiReviewQualitySnapshots(
  limit = 30,
): Promise<AiReviewQualitySnapshotRecord[]> {
  return readArray((db) =>
    db
      .select()
      .from(aiReviewQualitySnapshots)
      .orderBy(desc(aiReviewQualitySnapshots.reviewedAt), desc(aiReviewQualitySnapshots.createdAt))
      .limit(limit),
  );
}

export async function getCaseStudyBySlug(
  slug: string,
): Promise<CaseStudyDetailRecord | null> {
  return readOne(async (db) => {
    const [caseStudy] = await db
      .select()
      .from(caseStudies)
      .where(and(eq(caseStudies.slug, slug), eq(caseStudies.status, "published")))
      .limit(1);

    if (!caseStudy) {
      return undefined;
    }

    const [
      lensRows,
      principleRows,
      experienceRows,
      projectRows,
      skillRows,
      tagRows,
    ] = await Promise.all([
      db
        .select({ lens: lenses })
        .from(caseStudyLenses)
        .innerJoin(lenses, eq(caseStudyLenses.lensId, lenses.id))
        .where(
          and(eq(caseStudyLenses.caseStudyId, caseStudy.id), eq(lenses.status, "published")),
        )
        .orderBy(asc(lenses.position), asc(lenses.name)),
      db
        .select({ principle: principles })
        .from(caseStudyPrinciples)
        .innerJoin(principles, eq(caseStudyPrinciples.principleId, principles.id))
        .where(
          and(
            eq(caseStudyPrinciples.caseStudyId, caseStudy.id),
            eq(principles.status, "published"),
          ),
        )
        .orderBy(asc(principles.position), asc(principles.title)),
      db
        .select({ experience: experiences })
        .from(caseStudyExperiences)
        .innerJoin(experiences, eq(caseStudyExperiences.experienceId, experiences.id))
        .where(
          and(
            eq(caseStudyExperiences.caseStudyId, caseStudy.id),
            eq(experiences.status, "published"),
          ),
        )
        .orderBy(...reverseChronologicalExperienceOrder()),
      db
        .select({ project: projects })
        .from(caseStudyProjects)
        .innerJoin(projects, eq(caseStudyProjects.projectId, projects.id))
        .where(
          and(
            eq(caseStudyProjects.caseStudyId, caseStudy.id),
            eq(projects.status, "published"),
            eq(projects.visibility, "public"),
          ),
        )
        .orderBy(asc(projects.position), asc(projects.name)),
      db
        .select({ skill: skills })
        .from(caseStudySkills)
        .innerJoin(skills, eq(caseStudySkills.skillId, skills.id))
        .where(
          and(eq(caseStudySkills.caseStudyId, caseStudy.id), eq(skills.status, "published")),
        )
        .orderBy(sql`${skills.category} asc nulls last`, asc(skills.position), asc(skills.name)),
      db
        .select({ tag: tags })
        .from(caseStudyTags)
        .innerJoin(tags, eq(caseStudyTags.tagId, tags.id))
        .where(and(eq(caseStudyTags.caseStudyId, caseStudy.id), eq(tags.status, "published")))
        .orderBy(sql`${tags.category} asc nulls last`, asc(tags.name)),
    ]);

    return {
      caseStudy,
      lenses: lensRows.map((row) => row.lens),
      principles: principleRows.map((row) => row.principle),
      experiences: experienceRows.map((row) => row.experience),
      projects: projectRows.map((row) => row.project),
      skills: skillRows.map((row) => row.skill),
      tags: tagRows.map((row) => row.tag),
    };
  });
}

export async function getExperienceBySlug(
  slug: string,
): Promise<ExperienceDetailRecord | null> {
  return readOne(async (db) => {
    const identifierCondition = isUuid(slug)
      ? or(eq(experiences.slug, slug), eq(experiences.id, slug))
      : eq(experiences.slug, slug);

    const [experience] = await db
      .select()
      .from(experiences)
      .where(and(eq(experiences.status, "published"), identifierCondition))
      .limit(1);

    if (!experience) {
      return undefined;
    }

    const [
      lensRows,
      principleRows,
      caseStudyRows,
      projectRows,
      directProjectRows,
      skillRows,
      tagRows,
    ] = await Promise.all([
        db
          .select({ lens: lenses })
          .from(experienceLenses)
          .innerJoin(lenses, eq(experienceLenses.lensId, lenses.id))
          .where(
            and(eq(experienceLenses.experienceId, experience.id), eq(lenses.status, "published")),
          )
          .orderBy(asc(lenses.position), asc(lenses.name)),
        db
          .select({ principle: principles })
          .from(experiencePrinciples)
          .innerJoin(principles, eq(experiencePrinciples.principleId, principles.id))
          .where(
            and(
              eq(experiencePrinciples.experienceId, experience.id),
              eq(principles.status, "published"),
            ),
          )
          .orderBy(asc(principles.position), asc(principles.title)),
        db
          .select({ caseStudy: caseStudies })
          .from(caseStudyExperiences)
          .innerJoin(caseStudies, eq(caseStudyExperiences.caseStudyId, caseStudies.id))
          .where(
            and(
              eq(caseStudyExperiences.experienceId, experience.id),
              eq(caseStudies.status, "published"),
            ),
          )
          .orderBy(asc(caseStudies.position), desc(caseStudies.publishedAt), desc(caseStudies.createdAt)),
        db
          .select({ project: projects })
          .from(caseStudyExperiences)
          .innerJoin(caseStudies, eq(caseStudyExperiences.caseStudyId, caseStudies.id))
          .innerJoin(caseStudyProjects, eq(caseStudyProjects.caseStudyId, caseStudies.id))
          .innerJoin(projects, eq(caseStudyProjects.projectId, projects.id))
          .where(
            and(
              eq(caseStudyExperiences.experienceId, experience.id),
              eq(caseStudies.status, "published"),
              eq(projects.status, "published"),
              eq(projects.visibility, "public"),
            ),
          )
          .orderBy(asc(projects.position), asc(projects.name)),
        // Projects linked directly to this experience via the optional "position".
        db
          .select()
          .from(projects)
          .where(
            and(
              eq(projects.experienceId, experience.id),
              eq(projects.status, "published"),
              eq(projects.visibility, "public"),
            ),
          )
          .orderBy(asc(projects.position), asc(projects.name)),
        db
          .select({ skill: skills })
          .from(experienceSkills)
          .innerJoin(skills, eq(experienceSkills.skillId, skills.id))
          .where(
            and(eq(experienceSkills.experienceId, experience.id), eq(skills.status, "published")),
          )
          .orderBy(sql`${skills.category} asc nulls last`, asc(skills.position), asc(skills.name)),
        db
          .select({ tag: tags })
          .from(experienceTags)
          .innerJoin(tags, eq(experienceTags.tagId, tags.id))
          .where(and(eq(experienceTags.experienceId, experience.id), eq(tags.status, "published")))
          .orderBy(sql`${tags.category} asc nulls last`, asc(tags.name)),
      ]);

    return {
      experience,
      lenses: lensRows.map((row) => row.lens),
      principles: principleRows.map((row) => row.principle),
      caseStudies: caseStudyRows.map((row) => row.caseStudy),
      projects: uniqueById([
        ...directProjectRows,
        ...projectRows.map((row) => row.project),
      ]),
      skills: skillRows.map((row) => row.skill),
      tags: tagRows.map((row) => row.tag),
    };
  });
}

export async function getProjectBySlug(slug: string): Promise<ProjectDetailRecord | null> {
  return readOne(async (db) => {
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.slug, slug),
          eq(projects.status, "published"),
          eq(projects.visibility, "public"),
        ),
      )
      .limit(1);

    if (!project) {
      return undefined;
    }

    const [lensRows, principleRows, skillRows, tagRows, caseStudyRows] = await Promise.all([
      db
        .select({ lens: lenses })
        .from(projectLenses)
        .innerJoin(lenses, eq(projectLenses.lensId, lenses.id))
        .where(and(eq(projectLenses.projectId, project.id), eq(lenses.status, "published")))
        .orderBy(asc(lenses.position), asc(lenses.name)),
      db
        .select({ principle: principles })
        .from(projectPrinciples)
        .innerJoin(principles, eq(projectPrinciples.principleId, principles.id))
        .where(
          and(eq(projectPrinciples.projectId, project.id), eq(principles.status, "published")),
        )
        .orderBy(asc(principles.position), asc(principles.title)),
      db
        .select({ skill: skills })
        .from(projectSkills)
        .innerJoin(skills, eq(projectSkills.skillId, skills.id))
        .where(and(eq(projectSkills.projectId, project.id), eq(skills.status, "published")))
        .orderBy(sql`${skills.category} asc nulls last`, asc(skills.position), asc(skills.name)),
      db
        .select({ tag: tags })
        .from(projectTags)
        .innerJoin(tags, eq(projectTags.tagId, tags.id))
        .where(and(eq(projectTags.projectId, project.id), eq(tags.status, "published")))
        .orderBy(sql`${tags.category} asc nulls last`, asc(tags.name)),
      db
        .select({ caseStudy: caseStudies })
        .from(caseStudyProjects)
        .innerJoin(caseStudies, eq(caseStudyProjects.caseStudyId, caseStudies.id))
        .where(
          and(eq(caseStudyProjects.projectId, project.id), eq(caseStudies.status, "published")),
        )
        .orderBy(
          asc(caseStudies.position),
          desc(caseStudies.publishedAt),
          desc(caseStudies.createdAt),
        ),
    ]);

    // The optional "position" the project was built during (published only).
    let experience: ExperienceRecord | null = null;
    if (project.experienceId) {
      const [row] = await db
        .select()
        .from(experiences)
        .where(
          and(eq(experiences.id, project.experienceId), eq(experiences.status, "published")),
        )
        .limit(1);
      experience = row ?? null;
    }

    return {
      project,
      experience,
      lenses: lensRows.map((row) => row.lens),
      principles: principleRows.map((row) => row.principle),
      skills: skillRows.map((row) => row.skill),
      tags: tagRows.map((row) => row.tag),
      caseStudies: caseStudyRows.map((row) => row.caseStudy),
    };
  });
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function getLensBySlug(slug: string): Promise<LensDetailRecord | null> {
  return readOne(async (db) => {
    const [lens] = await db
      .select()
      .from(lenses)
      .where(and(eq(lenses.slug, slug), eq(lenses.status, "published")))
      .limit(1);

    if (!lens) {
      return undefined;
    }

    const [caseStudyRows, experienceRows, projectRows, principleRows] = await Promise.all([
      db
        .select({ caseStudy: caseStudies })
        .from(caseStudyLenses)
        .innerJoin(caseStudies, eq(caseStudyLenses.caseStudyId, caseStudies.id))
        .where(and(eq(caseStudyLenses.lensId, lens.id), eq(caseStudies.status, "published")))
        .orderBy(asc(caseStudies.position), desc(caseStudies.publishedAt)),
      db
        .select({ experience: experiences })
        .from(caseStudyExperiences)
        .innerJoin(experiences, eq(caseStudyExperiences.experienceId, experiences.id))
        .innerJoin(caseStudies, eq(caseStudyExperiences.caseStudyId, caseStudies.id))
        .innerJoin(caseStudyLenses, eq(caseStudyLenses.caseStudyId, caseStudies.id))
        .where(
          and(
            eq(caseStudyLenses.lensId, lens.id),
            eq(caseStudies.status, "published"),
            eq(experiences.status, "published"),
          ),
        )
        .orderBy(...reverseChronologicalExperienceOrder()),
      db
        .select({ project: projects })
        .from(caseStudyProjects)
        .innerJoin(projects, eq(caseStudyProjects.projectId, projects.id))
        .innerJoin(caseStudies, eq(caseStudyProjects.caseStudyId, caseStudies.id))
        .innerJoin(caseStudyLenses, eq(caseStudyLenses.caseStudyId, caseStudies.id))
        .where(
          and(
            eq(caseStudyLenses.lensId, lens.id),
            eq(caseStudies.status, "published"),
            eq(projects.status, "published"),
            eq(projects.visibility, "public"),
          ),
        )
        .orderBy(asc(projects.position), asc(projects.name)),
      db
        .select({ principle: principles })
        .from(caseStudyPrinciples)
        .innerJoin(principles, eq(caseStudyPrinciples.principleId, principles.id))
        .innerJoin(caseStudies, eq(caseStudyPrinciples.caseStudyId, caseStudies.id))
        .innerJoin(caseStudyLenses, eq(caseStudyLenses.caseStudyId, caseStudies.id))
        .where(
          and(
            eq(caseStudyLenses.lensId, lens.id),
            eq(caseStudies.status, "published"),
            eq(principles.status, "published"),
          ),
        )
        .orderBy(asc(principles.position), asc(principles.title)),
    ]);

    return {
      lens,
      caseStudies: caseStudyRows.map((row) => row.caseStudy),
      experiences: uniqueById(experienceRows.map((row) => row.experience)),
      projects: uniqueById(projectRows.map((row) => row.project)),
      principles: uniqueById(principleRows.map((row) => row.principle)),
    };
  });
}

function uniqueById<T extends { id: string }>(records: T[]): T[] {
  const seen = new Set<string>();
  return records.filter((record) => {
    if (seen.has(record.id)) {
      return false;
    }

    seen.add(record.id);
    return true;
  });
}

function groupRelationIds(rows: Array<{ ownerId: string; id: string }>): Map<string, string[]> {
  const grouped = new Map<string, string[]>();

  for (const row of rows) {
    grouped.set(row.ownerId, [...(grouped.get(row.ownerId) ?? []), row.id]);
  }

  return grouped;
}

function reverseChronologicalExperienceOrder() {
  return [
    desc(experiences.isCurrent),
    sql`${experiences.startDate} desc nulls last`,
    sql`${experiences.endDate} desc nulls last`,
    desc(experiences.createdAt),
  ];
}

// ---------------------------------------------------------------------------
// Admin single-record lookups (any status) used to populate edit forms.
// ---------------------------------------------------------------------------

export async function getLensById(id: string): Promise<LensRecord | null> {
  return readOne(async (db) => {
    const [row] = await db.select().from(lenses).where(eq(lenses.id, id)).limit(1);
    return row;
  });
}

export async function getPrincipleById(id: string): Promise<PrincipleRecord | null> {
  return readOne(async (db) => {
    const [row] = await db.select().from(principles).where(eq(principles.id, id)).limit(1);
    return row;
  });
}

export async function getSkillById(id: string): Promise<SkillRecord | null> {
  return readOne(async (db) => {
    const [row] = await db.select().from(skills).where(eq(skills.id, id)).limit(1);
    return row;
  });
}

export async function getTagById(id: string): Promise<TagRecord | null> {
  return readOne(async (db) => {
    const [row] = await db.select().from(tags).where(eq(tags.id, id)).limit(1);
    return row;
  });
}

export async function getDecisionPatternById(
  id: string,
): Promise<DecisionPatternEditRecord | null> {
  return readOne(async (db) => {
    const [record] = await db
      .select()
      .from(decisionPatterns)
      .where(eq(decisionPatterns.id, id))
      .limit(1);

    if (!record) {
      return undefined;
    }

    const principleRows = await db
      .select({ id: decisionPatternPrinciples.principleId })
      .from(decisionPatternPrinciples)
      .where(eq(decisionPatternPrinciples.decisionPatternId, id));

    return { ...record, principleIds: principleRows.map((row) => row.id) };
  });
}

export async function getExperienceById(id: string): Promise<ExperienceEditRecord | null> {
  return readOne(async (db) => {
    const [record] = await db.select().from(experiences).where(eq(experiences.id, id)).limit(1);

    if (!record) {
      return undefined;
    }

    const [lensRows, principleRows, skillRows, tagRows] = await Promise.all([
      db
        .select({ id: experienceLenses.lensId })
        .from(experienceLenses)
        .where(eq(experienceLenses.experienceId, id)),
      db
        .select({ id: experiencePrinciples.principleId })
        .from(experiencePrinciples)
        .where(eq(experiencePrinciples.experienceId, id)),
      db
        .select({ id: experienceSkills.skillId })
        .from(experienceSkills)
        .where(eq(experienceSkills.experienceId, id)),
      db
        .select({ id: experienceTags.tagId })
        .from(experienceTags)
        .where(eq(experienceTags.experienceId, id)),
    ]);

    return {
      ...record,
      lensIds: lensRows.map((row) => row.id),
      principleIds: principleRows.map((row) => row.id),
      skillIds: skillRows.map((row) => row.id),
      tagIds: tagRows.map((row) => row.id),
    };
  });
}

export async function getProjectById(id: string): Promise<ProjectEditRecord | null> {
  return readOne(async (db) => {
    const [record] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

    if (!record) {
      return undefined;
    }

    const [lensRows, principleRows, skillRows, tagRows] = await Promise.all([
      db
        .select({ id: projectLenses.lensId })
        .from(projectLenses)
        .where(eq(projectLenses.projectId, id)),
      db
        .select({ id: projectPrinciples.principleId })
        .from(projectPrinciples)
        .where(eq(projectPrinciples.projectId, id)),
      db
        .select({ id: projectSkills.skillId })
        .from(projectSkills)
        .where(eq(projectSkills.projectId, id)),
      db
        .select({ id: projectTags.tagId })
        .from(projectTags)
        .where(eq(projectTags.projectId, id)),
    ]);

    return {
      ...record,
      lensIds: lensRows.map((row) => row.id),
      principleIds: principleRows.map((row) => row.id),
      skillIds: skillRows.map((row) => row.id),
      tagIds: tagRows.map((row) => row.id),
    };
  });
}

export async function getCaseStudyById(id: string): Promise<CaseStudyEditRecord | null> {
  return readOne(async (db) => {
    const [record] = await db.select().from(caseStudies).where(eq(caseStudies.id, id)).limit(1);

    if (!record) {
      return undefined;
    }

    const [lensRows, principleRows, experienceRows, projectRows, skillRows, tagRows] =
      await Promise.all([
        db
          .select({ id: caseStudyLenses.lensId })
          .from(caseStudyLenses)
          .where(eq(caseStudyLenses.caseStudyId, id)),
        db
          .select({ id: caseStudyPrinciples.principleId })
          .from(caseStudyPrinciples)
          .where(eq(caseStudyPrinciples.caseStudyId, id)),
        db
          .select({ id: caseStudyExperiences.experienceId })
          .from(caseStudyExperiences)
          .where(eq(caseStudyExperiences.caseStudyId, id)),
        db
          .select({ id: caseStudyProjects.projectId })
          .from(caseStudyProjects)
          .where(eq(caseStudyProjects.caseStudyId, id)),
        db
          .select({ id: caseStudySkills.skillId })
          .from(caseStudySkills)
          .where(eq(caseStudySkills.caseStudyId, id)),
        db
          .select({ id: caseStudyTags.tagId })
          .from(caseStudyTags)
          .where(eq(caseStudyTags.caseStudyId, id)),
      ]);

    return {
      ...record,
      lensIds: lensRows.map((row) => row.id),
      principleIds: principleRows.map((row) => row.id),
      experienceIds: experienceRows.map((row) => row.id),
      projectIds: projectRows.map((row) => row.id),
      skillIds: skillRows.map((row) => row.id),
      tagIds: tagRows.map((row) => row.id),
    };
  });
}

export async function getDBAvailability(
  options: { force?: boolean; source?: string } = {},
): Promise<{ isDbAvailable: boolean }> {
  const checkOptions: { force?: boolean; source: string } = {
    source: options.source ?? "database-health-check",
  };

  if (options.force !== undefined) {
    checkOptions.force = options.force;
  }

  const result = await verifyInitialDbConnection(checkOptions);

  return { isDbAvailable: result.ok };
}

// ---------------------------------------------------------------------------
// AI insight source. Published records plus bulk relation pairs and per-type
// draft counts — the raw material the insight pipeline normalizes into the
// compact PortfolioInsightInput snapshot. Published-only by design: evidence
// refs derived from this source are always safe to render publicly.
// ---------------------------------------------------------------------------

export interface InsightRelationPair {
  left: string;
  right: string;
}

export interface PublishedInsightSource {
  lenses: LensRecord[];
  principles: PrincipleRecord[];
  decisionPatterns: DecisionPatternRecord[];
  experiences: ExperienceRecord[];
  projects: ProjectRecord[];
  caseStudies: CaseStudyRecord[];
  skills: SkillRecord[];
  tags: TagRecord[];
  /** Records still in draft per type (aggregate only — titles never leave admin). */
  draftCounts: {
    lenses: number;
    principles: number;
    decisionPatterns: number;
    experiences: number;
    projects: number;
    caseStudies: number;
    skills: number;
    tags: number;
  };
  /** Join-table pairs, unfiltered; the normalizer keeps only published⇄published pairs. */
  relations: {
    experienceLenses: InsightRelationPair[];
    experiencePrinciples: InsightRelationPair[];
    experienceSkills: InsightRelationPair[];
    experienceTags: InsightRelationPair[];
    projectLenses: InsightRelationPair[];
    projectPrinciples: InsightRelationPair[];
    projectSkills: InsightRelationPair[];
    projectTags: InsightRelationPair[];
    caseStudyLenses: InsightRelationPair[];
    caseStudyPrinciples: InsightRelationPair[];
    caseStudyExperiences: InsightRelationPair[];
    caseStudyProjects: InsightRelationPair[];
    caseStudySkills: InsightRelationPair[];
    caseStudyTags: InsightRelationPair[];
    decisionPatternPrinciples: InsightRelationPair[];
  };
}

export async function getPublishedInsightSource(): Promise<PublishedInsightSource> {
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
    caseStudyExperienceRows,
    caseStudyProjectRows,
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
    readArray((db) => db.select().from(caseStudyExperiences)),
    readArray((db) => db.select().from(caseStudyProjects)),
    readArray((db) => db.select().from(caseStudySkills)),
    readArray((db) => db.select().from(caseStudyTags)),
    readArray((db) => db.select().from(decisionPatternPrinciples)),
  ]);

  const published = <T extends { status: string }>(rows: T[]): T[] =>
    rows.filter((row) => row.status === "published");
  const draftCount = (rows: Array<{ status: string }>): number =>
    rows.filter((row) => row.status === "draft").length;

  return {
    lenses: published(index.lenses),
    principles: published(index.principles),
    decisionPatterns: published(index.decisionPatterns),
    experiences: published(index.experiences),
    projects: published(index.projects),
    caseStudies: published(index.caseStudies),
    skills: published(index.skills),
    tags: published(index.tags),
    draftCounts: {
      lenses: draftCount(index.lenses),
      principles: draftCount(index.principles),
      decisionPatterns: draftCount(index.decisionPatterns),
      experiences: draftCount(index.experiences),
      projects: draftCount(index.projects),
      caseStudies: draftCount(index.caseStudies),
      skills: draftCount(index.skills),
      tags: draftCount(index.tags),
    },
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
      caseStudyExperiences: caseStudyExperienceRows.map((row) => ({
        left: row.caseStudyId,
        right: row.experienceId,
      })),
      caseStudyProjects: caseStudyProjectRows.map((row) => ({
        left: row.caseStudyId,
        right: row.projectId,
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
