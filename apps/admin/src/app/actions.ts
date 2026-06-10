"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { setFlash } from "@/lib/flash";

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
  deleteSkills,
  deleteTag,
  patchCaseStudy,
  patchDecisionPattern,
  patchExperience,
  patchLens,
  patchPrinciple,
  patchProject,
  patchSkill,
  patchTag,
  updateCaseStudy,
  updateDecisionPattern,
  updateExperience,
  updateLens,
  updatePrinciple,
  updateProject,
  updateSkill,
  updateTag,
  upsertContactProfile,
  upsertHomepageSettings,
} from "@portfolio/db/admin";
import type {
  CreateCaseStudyInput,
  CreateDecisionPatternInput,
  CreateExperienceInput,
  CreateLensInput,
  CreatePrincipleInput,
  CreateProjectInput,
  CreateSkillInput,
  CreateTagInput,
} from "@portfolio/validators";
import {
  bulkSkillsSchema,
  bulkTagsSchema,
  contactProfileSchema,
  createCaseStudySchema,
  createDecisionPatternSchema,
  createExperienceSchema,
  createLensSchema,
  createPrincipleSchema,
  createProjectSchema,
  createSkillSchema,
  createTagSchema,
  homepageSettingsSchema,
  idInputSchema,
  patchCaseStudySchema,
  patchDecisionPatternSchema,
  patchExperienceSchema,
  patchLensSchema,
  patchPrincipleSchema,
  patchProjectSchema,
  patchSkillSchema,
  patchTagSchema,
  updateCaseStudySchema,
  updateDecisionPatternSchema,
  updateExperienceSchema,
  updateLensSchema,
  updatePrincipleSchema,
  updateProjectSchema,
  updateSkillSchema,
  updateTagSchema,
} from "@portfolio/validators";
import type { z } from "zod";

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

function parseHomepageMetricRows(value: string) {
  return bulkLines(value).map((line) => {
    const [valuePart = "", label = "", detail = ""] = line
      .split("|")
      .map((part) => part.trim());

    return {
      value: valuePart,
      label,
      detail: detail || undefined,
    };
  });
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

  await setFlash("Lens created");
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

  await setFlash("Principle created");
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

  await setFlash("Decision pattern created");
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
      awards: text(formData, "awards"),
      status: status(formData),
      ...seo(formData),
      lensIds: ids(formData, "lensIds"),
      principleIds: ids(formData, "principleIds"),
      skillIds: ids(formData, "skillIds"),
      tagIds: ids(formData, "tagIds"),
      position: text(formData, "position"),
    }),
  );

  await setFlash("Experience created");
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
      architecture: text(formData, "architecture"),
      developmentTechStack: text(formData, "developmentTechStack"),
      qaTechStack: text(formData, "qaTechStack"),
      aiIntegrationTechStack: text(formData, "aiIntegrationTechStack"),
      deploymentTechStack: text(formData, "deploymentTechStack"),
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

  await setFlash("Project created");
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

  await setFlash("Case study created");
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

  await setFlash("Skill created");
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

  await setFlash("Tag created");
  refresh("/content/tags");
  redirect("/content/tags");
}

export async function bulkUpsertSkillsAction(formData: FormData): Promise<void> {
  await bulkUpsertSkills(
    bulkSkillsSchema.parse({
      items: parseBulkSkillRows(text(formData, "items")),
    }),
  );

  await setFlash("Skills saved");
  refresh("/content/skills");
  redirect("/content/skills");
}

export async function bulkUpsertTagsAction(formData: FormData): Promise<void> {
  await bulkUpsertTags(
    bulkTagsSchema.parse({
      items: parseBulkTagRows(text(formData, "items")),
    }),
  );

  await setFlash("Tags saved");
  refresh("/content/tags");
  redirect("/content/tags");
}

export async function upsertContactProfileAction(formData: FormData): Promise<void> {
  await upsertContactProfile(
    contactProfileSchema.parse({
      locationLabel: text(formData, "locationLabel"),
      availabilityLabel: text(formData, "availabilityLabel"),
      timezoneLabel: text(formData, "timezoneLabel"),
      responseTimeLabel: text(formData, "responseTimeLabel"),
      linkedinUrl: text(formData, "linkedinUrl"),
      githubUrl: text(formData, "githubUrl"),
      emailAddress: text(formData, "emailAddress"),
      resumeUrl: text(formData, "resumeUrl"),
      shortContactIntro: text(formData, "shortContactIntro"),
      openToItems: bulkLines(text(formData, "openToItems")),
    }),
  );

  await setFlash("Contact profile saved");
  revalidatePath("/contact");
  refresh("/content/contact-profile");
  redirect("/content/contact-profile");
}

export async function upsertHomepageSettingsAction(formData: FormData): Promise<void> {
  await upsertHomepageSettings(
    homepageSettingsSchema.parse({
      roleLabel: text(formData, "roleLabel"),
      headline: text(formData, "headline"),
      headlineHighlight: text(formData, "headlineHighlight"),
      summary: text(formData, "summary"),
      primaryCtaLabel: text(formData, "primaryCtaLabel"),
      primaryCtaHref: text(formData, "primaryCtaHref"),
      secondaryCtaLabel: text(formData, "secondaryCtaLabel"),
      secondaryCtaHref: text(formData, "secondaryCtaHref"),
      codeRoleLabel: text(formData, "codeRoleLabel"),
      codeMindsetLabel: text(formData, "codeMindsetLabel"),
      codeLocationLabel: text(formData, "codeLocationLabel"),
      codeExperienceLabel: text(formData, "codeExperienceLabel"),
      codeFocusItems: bulkLines(text(formData, "codeFocusItems")),
      metricCards: parseHomepageMetricRows(text(formData, "metricCards")),
      featuredSkillIds: ids(formData, "featuredSkillIds"),
      featuredPrincipleIds: ids(formData, "featuredPrincipleIds"),
      featuredCaseStudyIds: ids(formData, "featuredCaseStudyIds"),
      featuredRecognitionExperienceId: text(formData, "featuredRecognitionExperienceId"),
    }),
  );

  await setFlash("Homepage saved");
  revalidatePath("/");
  refresh("/content/homepage");
  redirect("/content/homepage");
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

  await setFlash("Lens updated");
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

  await setFlash("Principle updated");
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

  await setFlash("Decision pattern updated");
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
      awards: text(formData, "awards"),
      status: status(formData),
      ...seo(formData),
      lensIds: ids(formData, "lensIds"),
      principleIds: ids(formData, "principleIds"),
      skillIds: ids(formData, "skillIds"),
      tagIds: ids(formData, "tagIds"),
      position: text(formData, "position"),
    }),
  );

  await setFlash("Experience updated");
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
      architecture: text(formData, "architecture"),
      developmentTechStack: text(formData, "developmentTechStack"),
      qaTechStack: text(formData, "qaTechStack"),
      aiIntegrationTechStack: text(formData, "aiIntegrationTechStack"),
      deploymentTechStack: text(formData, "deploymentTechStack"),
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

  await setFlash("Project updated");
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

  await setFlash("Case study updated");
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

  await setFlash("Skill updated");
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

  await setFlash("Tag updated");
  refresh("/content/tags");
  redirect("/content/tags");
}

// ---------------------------------------------------------------------------
// Patch actions. These power per-section ("inline") editing on the detail
// pages: a section form declares the field names it owns in a hidden `__fields`
// input and submits only those values (plus the id). The action validates and
// writes exactly those fields — every other column and relationship is left
// untouched. Unlike create/update, patches do NOT redirect, so the editor stays
// on the detail page and the saved section refreshes in place.
// ---------------------------------------------------------------------------

function declaredFields(formData: FormData): Set<string> {
  return new Set(text(formData, "__fields").split(/\s+/).filter((field) => field.length > 0));
}

async function applyPatch(
  formData: FormData,
  options: {
    schema: z.ZodTypeAny;
    scalarKeys: readonly string[];
    relationKeys: readonly string[];
    listPath: string;
    run: (args: {
      id: string;
      set: Record<string, unknown>;
      relations: Record<string, string[]>;
    }) => Promise<void>;
  },
): Promise<void> {
  const id = text(formData, "id");
  const declared = declaredFields(formData);

  // Only fields the section explicitly declared are read and validated.
  const rawScalars: Record<string, string> = {};
  for (const key of options.scalarKeys) {
    if (declared.has(key)) {
      rawScalars[key] = text(formData, key);
    }
  }

  const parsed = options.schema.parse({ id, ...rawScalars }) as Record<string, unknown>;

  const set: Record<string, unknown> = {};
  for (const key of options.scalarKeys) {
    if (declared.has(key) && parsed[key] !== undefined) {
      set[key] = parsed[key];
    }
  }

  // A declared-but-empty relation group submits no checkboxes; we still pass an
  // empty array so the mutation clears it. Undeclared relations stay untouched.
  const relations: Record<string, string[]> = {};
  for (const key of options.relationKeys) {
    if (declared.has(key)) {
      relations[key] = ids(formData, key);
    }
  }

  await options.run({ id, set, relations });

  revalidatePath("/");
  revalidatePath(options.listPath);
  revalidatePath(`${options.listPath}/${id}`);
}

export async function patchLensAction(formData: FormData): Promise<void> {
  await applyPatch(formData, {
    schema: patchLensSchema,
    scalarKeys: [
      "slug",
      "name",
      "summary",
      "accentColor",
      "status",
      "seoTitle",
      "seoDescription",
      "ogImage",
      "position",
    ],
    relationKeys: [],
    listPath: "/content/lenses",
    run: ({ id, set }) => patchLens({ id, set: set as Partial<CreateLensInput> }),
  });
}

export async function patchPrincipleAction(formData: FormData): Promise<void> {
  await applyPatch(formData, {
    schema: patchPrincipleSchema,
    scalarKeys: [
      "slug",
      "title",
      "summary",
      "body",
      "status",
      "seoTitle",
      "seoDescription",
      "ogImage",
      "position",
    ],
    relationKeys: [],
    listPath: "/content/principles",
    run: ({ id, set }) => patchPrinciple({ id, set: set as Partial<CreatePrincipleInput> }),
  });
}

export async function patchDecisionPatternAction(formData: FormData): Promise<void> {
  await applyPatch(formData, {
    schema: patchDecisionPatternSchema,
    scalarKeys: [
      "slug",
      "title",
      "summary",
      "body",
      "status",
      "seoTitle",
      "seoDescription",
      "ogImage",
      "position",
    ],
    relationKeys: ["principleIds"],
    listPath: "/content/decision-patterns",
    run: ({ id, set, relations }) =>
      patchDecisionPattern({ id, set: set as Partial<CreateDecisionPatternInput>, relations }),
  });
}

export async function patchExperienceAction(formData: FormData): Promise<void> {
  await applyPatch(formData, {
    schema: patchExperienceSchema,
    scalarKeys: [
      "slug",
      "company",
      "role",
      "location",
      "startDate",
      "endDate",
      "isCurrent",
      "summary",
      "details",
      "awards",
      "status",
      "seoTitle",
      "seoDescription",
      "ogImage",
      "position",
    ],
    relationKeys: ["lensIds", "principleIds", "skillIds", "tagIds"],
    listPath: "/content/experiences",
    run: ({ id, set, relations }) =>
      patchExperience({ id, set: set as Partial<CreateExperienceInput>, relations }),
  });
}

export async function patchProjectAction(formData: FormData): Promise<void> {
  await applyPatch(formData, {
    schema: patchProjectSchema,
    scalarKeys: [
      "slug",
      "name",
      "description",
      "details",
      "architecture",
      "developmentTechStack",
      "qaTechStack",
      "aiIntegrationTechStack",
      "deploymentTechStack",
      "status",
      "url",
      "githubUrl",
      "experienceId",
      "seoTitle",
      "seoDescription",
      "ogImage",
      "position",
    ],
    relationKeys: ["lensIds", "principleIds", "skillIds", "tagIds"],
    listPath: "/content/projects",
    run: ({ id, set, relations }) =>
      patchProject({ id, set: set as Partial<CreateProjectInput>, relations }),
  });
}

export async function patchCaseStudyAction(formData: FormData): Promise<void> {
  await applyPatch(formData, {
    schema: patchCaseStudySchema,
    scalarKeys: [
      "slug",
      "title",
      "excerpt",
      "context",
      "problem",
      "constraints",
      "action",
      "tradeoffs",
      "outcome",
      "learning",
      "status",
      "seoTitle",
      "seoDescription",
      "ogImage",
      "position",
    ],
    relationKeys: ["lensIds", "principleIds", "experienceIds", "projectIds", "skillIds", "tagIds"],
    listPath: "/content/case-studies",
    run: ({ id, set, relations }) =>
      patchCaseStudy({ id, set: set as Partial<CreateCaseStudyInput>, relations }),
  });
}

export async function patchSkillAction(formData: FormData): Promise<void> {
  await applyPatch(formData, {
    schema: patchSkillSchema,
    scalarKeys: ["slug", "name", "category", "summary", "status", "position"],
    relationKeys: [],
    listPath: "/content/skills",
    run: ({ id, set }) => patchSkill({ id, set: set as Partial<CreateSkillInput> }),
  });
}

export async function patchTagAction(formData: FormData): Promise<void> {
  await applyPatch(formData, {
    schema: patchTagSchema,
    scalarKeys: ["slug", "name", "category", "status"],
    relationKeys: [],
    listPath: "/content/tags",
    run: ({ id, set }) => patchTag({ id, set: set as Partial<CreateTagInput> }),
  });
}

// ---------------------------------------------------------------------------
// Delete actions. Each takes only the record id (cascades remove join rows).
// ---------------------------------------------------------------------------

export async function deleteLensAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  await deleteLens(id);
  await setFlash("Lens deleted");
  refresh("/content/lenses");
  redirect("/content/lenses");
}

export async function deletePrincipleAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  await deletePrinciple(id);
  await setFlash("Principle deleted");
  refresh("/content/principles");
  redirect("/content/principles");
}

export async function deleteDecisionPatternAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  await deleteDecisionPattern(id);
  await setFlash("Decision pattern deleted");
  refresh("/content/decision-patterns");
  redirect("/content/decision-patterns");
}

export async function deleteExperienceAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  await deleteExperience(id);
  await setFlash("Experience deleted");
  refresh("/content/experiences");
  redirect("/content/experiences");
}

export async function deleteProjectAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  await deleteProject(id);
  await setFlash("Project deleted");
  refresh("/content/projects");
  redirect("/content/projects");
}

export async function deleteCaseStudyAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  await deleteCaseStudy(id);
  await setFlash("Case study deleted");
  refresh("/content/case-studies");
  redirect("/content/case-studies");
}

export async function deleteSkillAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  await deleteSkill(id);
  await setFlash("Skill deleted");
  refresh("/content/skills");
  redirect("/content/skills");
}

/**
 * Deletes every skill in a category group at once. Submitted from the skills
 * list (one hidden `ids` input per skill), so it refreshes in place rather than
 * redirecting.
 */
export async function deleteSkillsAction(formData: FormData): Promise<void> {
  await deleteSkills(ids(formData, "ids"));
  refresh("/content/skills");
}

export async function deleteTagAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  await deleteTag(id);
  await setFlash("Tag deleted");
  refresh("/content/tags");
  redirect("/content/tags");
}
