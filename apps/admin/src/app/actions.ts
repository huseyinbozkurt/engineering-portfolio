"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  bulkUpsertSkills,
  bulkUpsertTags,
  createCaseStudy,
  createDecisionPattern,
  createExperience,
  createLens,
  createPrinciple,
  createProject,
  createSkill,
  createTag,
  deleteCaseStudy,
  deleteDecisionPattern,
  deleteExperience,
  deleteLens,
  deletePrinciple,
  deleteProject,
  deleteSkill,
  deleteTag,
  updateCaseStudy,
  updateDecisionPattern,
  updateExperience,
  updateLens,
  updatePrinciple,
  updateProject,
  updateSkill,
  updateTag,
} from "@portfolio/db/admin";
import {
  bulkSkillsSchema,
  bulkTagsSchema,
  createCaseStudySchema,
  createDecisionPatternSchema,
  createExperienceSchema,
  createLensSchema,
  createPrincipleSchema,
  createProjectSchema,
  createSkillSchema,
  createTagSchema,
  idInputSchema,
  updateCaseStudySchema,
  updateDecisionPatternSchema,
  updateExperienceSchema,
  updateLensSchema,
  updatePrincipleSchema,
  updateProjectSchema,
  updateSkillSchema,
  updateTagSchema,
} from "@portfolio/validators";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function ids(formData: FormData, key: string): string[] {
  return formData.getAll(key).filter((value): value is string => typeof value === "string");
}

function status(formData: FormData): string {
  return text(formData, "status") || "draft";
}

function seo(formData: FormData): {
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
} {
  return {
    seoTitle: text(formData, "seoTitle"),
    seoDescription: text(formData, "seoDescription"),
    ogImage: text(formData, "ogImage"),
  };
}

function refresh(path: string): void {
  revalidatePath("/");
  revalidatePath(path);
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || "item";
}

function bulkLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

function parseBulkSkillRows(value: string) {
  return bulkLines(value).map((line, index) => {
    const parts = line.split("|").map((part) => part.trim());

    if (parts.length <= 2) {
      const [name = "", category = ""] = parts;

      return {
        name,
        slug: slugify(name),
        category,
        summary: "",
        status: "draft",
        position: String(index),
      };
    }

    const [name = "", slug = "", category = "", statusValue = "", summary = "", position = ""] =
      parts;

    return {
      name,
      slug: slug || slugify(name),
      category,
      status: statusValue || "draft",
      summary,
      position: position || String(index),
    };
  });
}

function parseBulkTagRows(value: string) {
  return bulkLines(value).map((line) => {
    const parts = line.split("|").map((part) => part.trim());

    if (parts.length <= 2) {
      const [name = "", category = ""] = parts;

      return {
        name,
        slug: slugify(name),
        category,
        status: "draft",
      };
    }

    const [name = "", slug = "", category = "", statusValue = ""] = parts;

    return {
      name,
      slug: slug || slugify(name),
      category,
      status: statusValue || "draft",
    };
  });
}

export async function createLensAction(formData: FormData): Promise<void> {
  await createLens(
    createLensSchema.parse({
      slug: text(formData, "slug"),
      name: text(formData, "name"),
      summary: text(formData, "summary"),
      accentColor: text(formData, "accentColor") || "#7dd3fc",
      status: status(formData),
      ...seo(formData),
      position: text(formData, "position"),
    }),
  );

  refresh("/content/lenses");
  redirect("/content/lenses");
}

export async function createPrincipleAction(formData: FormData): Promise<void> {
  await createPrinciple(
    createPrincipleSchema.parse({
      slug: text(formData, "slug"),
      title: text(formData, "title"),
      summary: text(formData, "summary"),
      body: text(formData, "body"),
      status: status(formData),
      ...seo(formData),
      position: text(formData, "position"),
    }),
  );

  refresh("/content/principles");
  redirect("/content/principles");
}

export async function createDecisionPatternAction(formData: FormData): Promise<void> {
  await createDecisionPattern(
    createDecisionPatternSchema.parse({
      slug: text(formData, "slug"),
      title: text(formData, "title"),
      summary: text(formData, "summary"),
      body: text(formData, "body"),
      status: status(formData),
      ...seo(formData),
      principleIds: ids(formData, "principleIds"),
      position: text(formData, "position"),
    }),
  );

  refresh("/content/decision-patterns");
  redirect("/content/decision-patterns");
}

export async function createExperienceAction(formData: FormData): Promise<void> {
  await createExperience(
    createExperienceSchema.parse({
      slug: text(formData, "slug"),
      company: text(formData, "company"),
      role: text(formData, "role"),
      location: text(formData, "location"),
      startDate: text(formData, "startDate"),
      endDate: text(formData, "endDate"),
      isCurrent: formData.get("isCurrent") === "on",
      summary: text(formData, "summary"),
      details: text(formData, "details"),
      status: status(formData),
      ...seo(formData),
      lensIds: ids(formData, "lensIds"),
      principleIds: ids(formData, "principleIds"),
      skillIds: ids(formData, "skillIds"),
      tagIds: ids(formData, "tagIds"),
      position: text(formData, "position"),
    }),
  );

  refresh("/content/experiences");
  redirect("/content/experiences");
}

export async function createProjectAction(formData: FormData): Promise<void> {
  await createProject(
    createProjectSchema.parse({
      slug: text(formData, "slug"),
      name: text(formData, "name"),
      description: text(formData, "description"),
      details: text(formData, "details"),
      status: status(formData),
      url: text(formData, "url"),
      githubUrl: text(formData, "githubUrl"),
      ...seo(formData),
      experienceId: text(formData, "experienceId"),
      lensIds: ids(formData, "lensIds"),
      principleIds: ids(formData, "principleIds"),
      skillIds: ids(formData, "skillIds"),
      tagIds: ids(formData, "tagIds"),
      position: text(formData, "position"),
    }),
  );

  refresh("/content/projects");
  redirect("/content/projects");
}

export async function createCaseStudyAction(formData: FormData): Promise<void> {
  await createCaseStudy(
    createCaseStudySchema.parse({
      slug: text(formData, "slug"),
      title: text(formData, "title"),
      excerpt: text(formData, "excerpt"),
      status: status(formData),
      ...seo(formData),
      context: text(formData, "context"),
      problem: text(formData, "problem"),
      constraints: text(formData, "constraints"),
      action: text(formData, "action"),
      tradeoffs: text(formData, "tradeoffs"),
      outcome: text(formData, "outcome"),
      learning: text(formData, "learning"),
      lensIds: ids(formData, "lensIds"),
      principleIds: ids(formData, "principleIds"),
      experienceIds: ids(formData, "experienceIds"),
      projectIds: ids(formData, "projectIds"),
      skillIds: ids(formData, "skillIds"),
      tagIds: ids(formData, "tagIds"),
      position: text(formData, "position"),
    }),
  );

  refresh("/content/case-studies");
  redirect("/content/case-studies");
}

export async function createSkillAction(formData: FormData): Promise<void> {
  await createSkill(
    createSkillSchema.parse({
      slug: text(formData, "slug"),
      name: text(formData, "name"),
      category: text(formData, "category"),
      summary: text(formData, "summary"),
      status: status(formData),
      position: text(formData, "position"),
    }),
  );

  refresh("/content/skills");
  redirect("/content/skills");
}

export async function createTagAction(formData: FormData): Promise<void> {
  await createTag(
    createTagSchema.parse({
      slug: text(formData, "slug"),
      name: text(formData, "name"),
      category: text(formData, "category"),
      status: status(formData),
    }),
  );

  refresh("/content/tags");
  redirect("/content/tags");
}

export async function bulkUpsertSkillsAction(formData: FormData): Promise<void> {
  await bulkUpsertSkills(
    bulkSkillsSchema.parse({
      items: parseBulkSkillRows(text(formData, "items")),
    }),
  );

  refresh("/content/skills");
  redirect("/content/skills");
}

export async function bulkUpsertTagsAction(formData: FormData): Promise<void> {
  await bulkUpsertTags(
    bulkTagsSchema.parse({
      items: parseBulkTagRows(text(formData, "items")),
    }),
  );

  refresh("/content/tags");
  redirect("/content/tags");
}

// ---------------------------------------------------------------------------
// Update actions. Each parses the form (now including the record id) and
// redirects back to the list on success.
// ---------------------------------------------------------------------------

export async function updateLensAction(formData: FormData): Promise<void> {
  await updateLens(
    updateLensSchema.parse({
      id: text(formData, "id"),
      slug: text(formData, "slug"),
      name: text(formData, "name"),
      summary: text(formData, "summary"),
      accentColor: text(formData, "accentColor") || "#7dd3fc",
      status: status(formData),
      ...seo(formData),
      position: text(formData, "position"),
    }),
  );

  refresh("/content/lenses");
  redirect("/content/lenses");
}

export async function updatePrincipleAction(formData: FormData): Promise<void> {
  await updatePrinciple(
    updatePrincipleSchema.parse({
      id: text(formData, "id"),
      slug: text(formData, "slug"),
      title: text(formData, "title"),
      summary: text(formData, "summary"),
      body: text(formData, "body"),
      status: status(formData),
      ...seo(formData),
      position: text(formData, "position"),
    }),
  );

  refresh("/content/principles");
  redirect("/content/principles");
}

export async function updateDecisionPatternAction(formData: FormData): Promise<void> {
  await updateDecisionPattern(
    updateDecisionPatternSchema.parse({
      id: text(formData, "id"),
      slug: text(formData, "slug"),
      title: text(formData, "title"),
      summary: text(formData, "summary"),
      body: text(formData, "body"),
      status: status(formData),
      ...seo(formData),
      principleIds: ids(formData, "principleIds"),
      position: text(formData, "position"),
    }),
  );

  refresh("/content/decision-patterns");
  redirect("/content/decision-patterns");
}

export async function updateExperienceAction(formData: FormData): Promise<void> {
  await updateExperience(
    updateExperienceSchema.parse({
      id: text(formData, "id"),
      slug: text(formData, "slug"),
      company: text(formData, "company"),
      role: text(formData, "role"),
      location: text(formData, "location"),
      startDate: text(formData, "startDate"),
      endDate: text(formData, "endDate"),
      isCurrent: formData.get("isCurrent") === "on",
      summary: text(formData, "summary"),
      details: text(formData, "details"),
      status: status(formData),
      ...seo(formData),
      lensIds: ids(formData, "lensIds"),
      principleIds: ids(formData, "principleIds"),
      skillIds: ids(formData, "skillIds"),
      tagIds: ids(formData, "tagIds"),
      position: text(formData, "position"),
    }),
  );

  refresh("/content/experiences");
  redirect("/content/experiences");
}

export async function updateProjectAction(formData: FormData): Promise<void> {
  await updateProject(
    updateProjectSchema.parse({
      id: text(formData, "id"),
      slug: text(formData, "slug"),
      name: text(formData, "name"),
      description: text(formData, "description"),
      details: text(formData, "details"),
      status: status(formData),
      url: text(formData, "url"),
      githubUrl: text(formData, "githubUrl"),
      ...seo(formData),
      experienceId: text(formData, "experienceId"),
      lensIds: ids(formData, "lensIds"),
      principleIds: ids(formData, "principleIds"),
      skillIds: ids(formData, "skillIds"),
      tagIds: ids(formData, "tagIds"),
      position: text(formData, "position"),
    }),
  );

  refresh("/content/projects");
  redirect("/content/projects");
}

export async function updateCaseStudyAction(formData: FormData): Promise<void> {
  await updateCaseStudy(
    updateCaseStudySchema.parse({
      id: text(formData, "id"),
      slug: text(formData, "slug"),
      title: text(formData, "title"),
      excerpt: text(formData, "excerpt"),
      status: status(formData),
      ...seo(formData),
      context: text(formData, "context"),
      problem: text(formData, "problem"),
      constraints: text(formData, "constraints"),
      action: text(formData, "action"),
      tradeoffs: text(formData, "tradeoffs"),
      outcome: text(formData, "outcome"),
      learning: text(formData, "learning"),
      lensIds: ids(formData, "lensIds"),
      principleIds: ids(formData, "principleIds"),
      experienceIds: ids(formData, "experienceIds"),
      projectIds: ids(formData, "projectIds"),
      skillIds: ids(formData, "skillIds"),
      tagIds: ids(formData, "tagIds"),
      position: text(formData, "position"),
    }),
  );

  refresh("/content/case-studies");
  redirect("/content/case-studies");
}

export async function updateSkillAction(formData: FormData): Promise<void> {
  await updateSkill(
    updateSkillSchema.parse({
      id: text(formData, "id"),
      slug: text(formData, "slug"),
      name: text(formData, "name"),
      category: text(formData, "category"),
      summary: text(formData, "summary"),
      status: status(formData),
      position: text(formData, "position"),
    }),
  );

  refresh("/content/skills");
  redirect("/content/skills");
}

export async function updateTagAction(formData: FormData): Promise<void> {
  await updateTag(
    updateTagSchema.parse({
      id: text(formData, "id"),
      slug: text(formData, "slug"),
      name: text(formData, "name"),
      category: text(formData, "category"),
      status: status(formData),
    }),
  );

  refresh("/content/tags");
  redirect("/content/tags");
}

// ---------------------------------------------------------------------------
// Delete actions. Each takes only the record id (cascades remove join rows).
// ---------------------------------------------------------------------------

export async function deleteLensAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  await deleteLens(id);
  refresh("/content/lenses");
  redirect("/content/lenses");
}

export async function deletePrincipleAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  await deletePrinciple(id);
  refresh("/content/principles");
  redirect("/content/principles");
}

export async function deleteDecisionPatternAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  await deleteDecisionPattern(id);
  refresh("/content/decision-patterns");
  redirect("/content/decision-patterns");
}

export async function deleteExperienceAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  await deleteExperience(id);
  refresh("/content/experiences");
  redirect("/content/experiences");
}

export async function deleteProjectAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  await deleteProject(id);
  refresh("/content/projects");
  redirect("/content/projects");
}

export async function deleteCaseStudyAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  await deleteCaseStudy(id);
  refresh("/content/case-studies");
  redirect("/content/case-studies");
}

export async function deleteSkillAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  await deleteSkill(id);
  refresh("/content/skills");
  redirect("/content/skills");
}

export async function deleteTagAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  await deleteTag(id);
  refresh("/content/tags");
  redirect("/content/tags");
}
