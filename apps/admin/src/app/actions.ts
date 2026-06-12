"use server";

import { randomUUID } from "node:crypto";

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
import {
  setContentAiReviewQueued,
  type AiReviewContentType,
} from "@portfolio/db/content-ai-review";
import { setExperienceAiReviewQueued } from "@portfolio/db/experience-ai-review";
import {
  createLlmTask,
  getActiveLlmTaskForTarget,
} from "@portfolio/db/llm-tasks";
import { clearContactResume, setContactResume } from "@portfolio/db/resume";
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
  contentStatusSchema,
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
  validateResumeFile,
} from "@portfolio/validators";
import {
  getAdminContentIndex,
  getAllCaseStudies,
  getAllProjects,
  getCaseStudyById,
  getExperienceById,
  getExperienceListRecords,
  getProjectById,
} from "@portfolio/db/queries";
import { selectStaleReviewTargets } from "@portfolio/db/ai-review-freshness";
import { describeBulkEnqueue } from "@portfolio/db/llm-task-scheduling";
import { logLlmTaskEvent } from "@portfolio/db/llm-task-log";
import {
  buildContentAiReviewPrompt,
  buildExperienceAiReviewPrompt,
  caseStudyAiReviewTaskType,
  experienceAiReviewTaskType,
  hasOnlineLlmConnection,
  projectAiReviewTaskType,
  type ContentAiReviewInput,
  type ExperienceAiReviewInput,
} from "@portfolio/llm";
import { startQueuedLlmTaskProcessing } from "@portfolio/llm/task-runner";
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

function safeRedirectTarget(value: string, fallback: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

function experienceEditPath(id: string): string {
  return `/content/experiences/${id}`;
}

function refreshExperience(id: string): void {
  revalidatePath("/");
  revalidatePath("/experience");
  revalidatePath("/content/experiences");
  revalidatePath(experienceEditPath(id));
  revalidatePath(`/content/experiences/${id}/preview`);
  revalidatePath("/tasks");
}

function parseDraftExperience(): CreateExperienceInput {
  return createExperienceSchema.parse({
    slug: "",
    company: "",
    role: "",
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    summary: "",
    details: "",
    awards: "",
    status: "draft",
    seoTitle: "",
    seoDescription: "",
    ogImage: "",
    lensIds: [],
    principleIds: [],
    skillIds: [],
    tagIds: [],
    position: "",
  });
}

function missingExperiencePublishFields(experience: {
  company: string;
  role: string;
  startDate: string | null;
  summary: string;
}): string[] {
  const missing: string[] = [];

  if (!experience.role.trim()) {
    missing.push("role/title");
  }
  if (!experience.company.trim()) {
    missing.push("company");
  }
  if (!experience.startDate) {
    missing.push("start date");
  }
  if (!experience.summary.trim()) {
    missing.push("summary");
  }

  return missing;
}

function humanList(items: string[]): string {
  if (items.length <= 1) {
    return items[0] ?? "";
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

async function publishExperienceRecord(id: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const experience = await getExperienceById(id);

  if (!experience) {
    return { ok: false, message: "Experience not found." };
  }

  const missing = missingExperiencePublishFields(experience);

  if (missing.length > 0) {
    return {
      ok: false,
      message: `Cannot publish yet. Add ${humanList(missing)} before publishing.`,
    };
  }

  await patchExperience({ id, set: { status: "published" } });
  return { ok: true };
}

type QueueExperienceAiReviewResult = "queued" | "skipped" | "missing";

async function queueExperienceAiReview(id: string): Promise<QueueExperienceAiReviewResult> {
  const experience = await getExperienceById(id);

  if (!experience) {
    return "missing";
  }

  if (experience.aiReviewStatus === "queued" || experience.aiReviewStatus === "processing") {
    return "skipped";
  }

  const activeTask = await getActiveLlmTaskForTarget(experienceAiReviewTaskType, id);
  if (activeTask) {
    logLlmTaskEvent("skipped", {
      id: activeTask.id,
      taskType: experienceAiReviewTaskType,
      targetType: "experience",
      targetId: id,
      status: activeTask.status,
      detail: "duplicate_active",
    });
    return "skipped";
  }

  const prompt = buildExperienceAiReviewPrompt(toExperienceAiReviewInput(experience));
  const title = experienceAiReviewTaskTitle(experience);

  try {
    await createLlmTask({
      taskType: experienceAiReviewTaskType,
      targetType: "experience",
      targetId: id,
      title: `AI review: ${title}`,
      status: "pending",
      promptSystem: prompt.system,
      promptUser: prompt.user,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("llm_tasks_active_experience_ai_review_idx")) {
      return "skipped";
    }

    throw error;
  }

  await setExperienceAiReviewQueued(id);
  return "queued";
}

function toExperienceAiReviewInput(experience: {
  id: string;
  status: string;
  slug: string | null;
  company: string;
  role: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  summary: string;
  details: string;
  awards: string;
}): ExperienceAiReviewInput {
  return {
    id: experience.id,
    status: experience.status,
    slug: experience.slug,
    company: experience.company,
    role: experience.role,
    location: experience.location,
    startDate: experience.startDate,
    endDate: experience.endDate,
    isCurrent: experience.isCurrent,
    summary: experience.summary,
    details: experience.details,
    awards: experience.awards,
  };
}

function experienceAiReviewTaskTitle(experience: { role: string; company: string; id: string }): string {
  const role = experience.role.trim();
  const company = experience.company.trim();

  if (role && company) {
    return `${role} at ${company}`;
  }

  return role || company || `Untitled draft ${experience.id.slice(0, 8)}`;
}

function draftSlug(prefix: string): string {
  return `${prefix}-draft-${randomUUID()}`;
}

type EditorialContentType = AiReviewContentType;

function contentEditPath(contentType: EditorialContentType, id: string): string {
  if (contentType === "experience") {
    return experienceEditPath(id);
  }

  if (contentType === "project") {
    return `/content/projects/${id}`;
  }

  return `/content/case-studies/${id}`;
}

function contentListPath(contentType: EditorialContentType): string {
  if (contentType === "experience") {
    return "/content/experiences";
  }

  if (contentType === "project") {
    return "/content/projects";
  }

  return "/content/case-studies";
}

function contentLabel(contentType: EditorialContentType): string {
  if (contentType === "experience") return "Experience";
  if (contentType === "project") return "Project";
  return "Case study";
}

function refreshContent(contentType: EditorialContentType, id: string): void {
  const listPath = contentListPath(contentType);
  const editPath = contentEditPath(contentType, id);

  revalidatePath("/");
  revalidatePath(listPath);
  revalidatePath(editPath);
  revalidatePath(`${editPath}/preview`);
  revalidatePath("/tasks");

  if (contentType === "project") {
    revalidatePath("/projects");
  } else if (contentType === "case_study") {
    revalidatePath("/case-studies");
  }
}

function parseDraftProject(): CreateProjectInput {
  return createProjectSchema.parse({
    slug: draftSlug("project"),
    name: "",
    description: "",
    details: "",
    architecture: "",
    developmentTechStack: "",
    qaTechStack: "",
    aiIntegrationTechStack: "",
    deploymentTechStack: "",
    status: "draft",
    url: "",
    githubUrl: "",
    seoTitle: "",
    seoDescription: "",
    ogImage: "",
    experienceId: "",
    lensIds: [],
    principleIds: [],
    skillIds: [],
    tagIds: [],
    position: "",
    startDate: "",
    endDate: "",
  });
}

function parseDraftCaseStudy(): CreateCaseStudyInput {
  return createCaseStudySchema.parse({
    slug: draftSlug("case-study"),
    title: "",
    excerpt: "",
    status: "draft",
    seoTitle: "",
    seoDescription: "",
    ogImage: "",
    context: "",
    problem: "",
    constraints: "",
    action: "",
    tradeoffs: "",
    outcome: "",
    learning: "",
    lensIds: [],
    principleIds: [],
    experienceIds: [],
    projectIds: [],
    skillIds: [],
    tagIds: [],
    position: "",
  });
}

function missingProjectPublishFields(project: {
  name: string;
  description: string;
}): string[] {
  const missing: string[] = [];

  if (!project.name.trim()) missing.push("name");
  if (!project.description.trim()) missing.push("description");

  return missing;
}

function missingCaseStudyPublishFields(caseStudy: {
  title: string;
  excerpt: string;
  problem: string;
  action: string;
  outcome: string;
}): string[] {
  const missing: string[] = [];

  if (!caseStudy.title.trim()) missing.push("title");
  if (!caseStudy.excerpt.trim()) missing.push("excerpt");
  if (!caseStudy.problem.trim()) missing.push("problem");
  if (!caseStudy.action.trim()) missing.push("what I did");
  if (!caseStudy.outcome.trim()) missing.push("outcome");

  return missing;
}

async function publishProjectRecord(id: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const project = await getProjectById(id);

  if (!project) {
    return { ok: false, message: "Project not found." };
  }

  const missing = missingProjectPublishFields(project);

  if (missing.length > 0) {
    return {
      ok: false,
      message: `Cannot publish yet. Add ${humanList(missing)} before publishing.`,
    };
  }

  await patchProject({ id, set: { status: "published" } });
  return { ok: true };
}

async function publishCaseStudyRecord(id: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const caseStudy = await getCaseStudyById(id);

  if (!caseStudy) {
    return { ok: false, message: "Case study not found." };
  }

  const missing = missingCaseStudyPublishFields(caseStudy);

  if (missing.length > 0) {
    return {
      ok: false,
      message: `Cannot publish yet. Add ${humanList(missing)} before publishing.`,
    };
  }

  await patchCaseStudy({ id, set: { status: "published" } });
  return { ok: true };
}

function contentAiReviewTaskType(contentType: EditorialContentType): string {
  if (contentType === "experience") return experienceAiReviewTaskType;
  if (contentType === "project") return projectAiReviewTaskType;
  return caseStudyAiReviewTaskType;
}

type QueueContentAiReviewResult = "queued" | "skipped" | "missing";

async function queueContentAiReview(
  contentType: EditorialContentType,
  id: string,
): Promise<QueueContentAiReviewResult> {
  const input = await getContentAiReviewInput(contentType, id);

  if (!input) {
    return "missing";
  }

  if (input.aiReviewStatus === "queued" || input.aiReviewStatus === "processing") {
    return "skipped";
  }

  const taskType = contentAiReviewTaskType(contentType);
  const activeTask = await getActiveLlmTaskForTarget(taskType, id);
  if (activeTask) {
    logLlmTaskEvent("skipped", {
      id: activeTask.id,
      taskType,
      targetType: contentType,
      targetId: id,
      status: activeTask.status,
      detail: "duplicate_active",
    });
    return "skipped";
  }

  const prompt =
    contentType === "experience"
      ? buildExperienceAiReviewPrompt(input.promptInput as ExperienceAiReviewInput)
      : buildContentAiReviewPrompt(input.promptInput as ContentAiReviewInput);

  try {
    await createLlmTask({
      taskType,
      targetType: contentType,
      targetId: id,
      title: `AI review: ${input.title}`,
      status: "pending",
      promptSystem: prompt.system,
      promptUser: prompt.user,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (
      message.includes("llm_tasks_active_experience_ai_review_idx") ||
      message.includes("llm_tasks_active_project_ai_review_idx") ||
      message.includes("llm_tasks_active_case_study_ai_review_idx")
    ) {
      return "skipped";
    }

    throw error;
  }

  await setContentAiReviewQueued(contentType, id);
  return "queued";
}

async function getContentAiReviewInput(
  contentType: EditorialContentType,
  id: string,
): Promise<{
  aiReviewStatus: string;
  title: string;
  promptInput: ExperienceAiReviewInput | ContentAiReviewInput;
} | null> {
  if (contentType === "experience") {
    const experience = await getExperienceById(id);
    if (!experience) return null;

    return {
      aiReviewStatus: experience.aiReviewStatus,
      title: experienceAiReviewTaskTitle(experience),
      promptInput: toExperienceAiReviewInput(experience),
    };
  }

  if (contentType === "project") {
    const project = await getProjectById(id);
    if (!project) return null;

    return {
      aiReviewStatus: project.aiReviewStatus,
      title: project.name.trim() || `Untitled draft ${project.id.slice(0, 8)}`,
      promptInput: {
        entityType: "project",
        id: project.id,
        status: project.status,
        slug: project.slug,
        title: project.name,
        fields: {
          name: project.name,
          description: project.description,
          details: project.details,
          architecture: project.architecture,
          developmentTechStack: project.developmentTechStack,
          qaTechStack: project.qaTechStack,
          aiIntegrationTechStack: project.aiIntegrationTechStack,
          deploymentTechStack: project.deploymentTechStack,
          startDate: project.startDate,
          endDate: project.endDate,
          url: project.url,
          githubUrl: project.githubUrl,
        },
        relations: {
          experienceId: project.experienceId,
          lensIds: project.lensIds,
          principleIds: project.principleIds,
          skillIds: project.skillIds,
          tagIds: project.tagIds,
        },
      },
    };
  }

  const caseStudy = await getCaseStudyById(id);
  if (!caseStudy) return null;

  return {
    aiReviewStatus: caseStudy.aiReviewStatus,
    title: caseStudy.title.trim() || `Untitled draft ${caseStudy.id.slice(0, 8)}`,
    promptInput: {
      entityType: "case_study",
      id: caseStudy.id,
      status: caseStudy.status,
      slug: caseStudy.slug,
      title: caseStudy.title,
      fields: {
        title: caseStudy.title,
        excerpt: caseStudy.excerpt,
        context: caseStudy.context,
        problem: caseStudy.problem,
        constraints: caseStudy.constraints,
        action: caseStudy.action,
        tradeoffs: caseStudy.tradeoffs,
        outcome: caseStudy.outcome,
        learning: caseStudy.learning,
      },
      relations: {
        lensIds: caseStudy.lensIds,
        principleIds: caseStudy.principleIds,
        experienceIds: caseStudy.experienceIds,
        projectIds: caseStudy.projectIds,
        skillIds: caseStudy.skillIds,
        tagIds: caseStudy.tagIds,
      },
    },
  };
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

export async function createExperienceDraftAction(_formData: FormData): Promise<void> {
  const id = await createExperience(parseDraftExperience());

  await setFlash("Draft created");
  refreshExperience(id);
  redirect(experienceEditPath(id));
}

export async function duplicateExperienceAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  const source = await getExperienceById(id);

  if (!source) {
    await setFlash("Experience not found.", "error");
    redirect("/content/experiences");
  }

  const duplicateId = await createExperience(
    createExperienceSchema.parse({
      slug: "",
      company: source.company,
      role: source.role,
      location: source.location ?? "",
      startDate: source.startDate ?? "",
      endDate: source.endDate ?? "",
      isCurrent: source.isCurrent,
      summary: source.summary,
      details: source.details,
      awards: source.awards,
      status: "draft",
      seoTitle: source.seoTitle ?? "",
      seoDescription: source.seoDescription ?? "",
      ogImage: source.ogImage ?? "",
      lensIds: source.lensIds,
      principleIds: source.principleIds,
      skillIds: source.skillIds,
      tagIds: source.tagIds,
      position: source.position,
    }),
  );

  await setFlash("Draft duplicate created");
  refreshExperience(duplicateId);
  redirect(experienceEditPath(duplicateId));
}

export async function publishExperienceAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  const fallback = experienceEditPath(id);
  const redirectTo = safeRedirectTarget(text(formData, "redirectTo"), fallback);
  const result = await publishExperienceRecord(id);

  if (!result.ok) {
    await setFlash(result.message, "error");
    redirect(fallback);
  }

  await setFlash("Experience published");
  refreshExperience(id);
  redirect(redirectTo);
}

export async function unpublishExperienceAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  const redirectTo = safeRedirectTarget(text(formData, "redirectTo"), experienceEditPath(id));

  await patchExperience({ id, set: { status: "draft" } });
  await setFlash("Experience moved back to draft");
  refreshExperience(id);
  redirect(redirectTo);
}

export async function archiveExperienceAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  const redirectTo = safeRedirectTarget(text(formData, "redirectTo"), experienceEditPath(id));

  await patchExperience({ id, set: { status: "archived" } });
  await setFlash("Experience archived");
  refreshExperience(id);
  redirect(redirectTo);
}

export async function setExperienceStatusAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  const nextStatus = contentStatusSchema.parse(status(formData));
  const redirectTo = safeRedirectTarget(text(formData, "redirectTo"), experienceEditPath(id));

  if (nextStatus === "published") {
    const result = await publishExperienceRecord(id);

    if (!result.ok) {
      await setFlash(result.message, "error");
      redirect(experienceEditPath(id));
    }

    await setFlash("Experience published");
    refreshExperience(id);
    redirect(redirectTo);
  }

  await patchExperience({ id, set: { status: nextStatus } });
  await setFlash(nextStatus === "archived" ? "Experience archived" : "Experience saved as draft");
  refreshExperience(id);
  redirect(redirectTo);
}

export async function runExperienceAiReviewAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  const redirectTo = safeRedirectTarget(text(formData, "redirectTo"), experienceEditPath(id));

  if (!(await hasOnlineLlmConnection())) {
    await setFlash(
      "No online LLM connection is available. Configure a reachable provider before running AI review.",
      "error",
    );
    refreshExperience(id);
    redirect(redirectTo);
  }

  const result = await queueExperienceAiReview(id);

  if (result === "missing") {
    await setFlash("Experience not found.", "error");
  } else if (result === "skipped") {
    await setFlash("AI review is already queued or processing for this experience.", "info");
  } else {
    await setFlash("AI review queued");
    startQueuedLlmTaskProcessing();
  }

  refreshExperience(id);
  redirect(redirectTo);
}

export async function runAllExperienceAiReviewsAction(_formData: FormData): Promise<void> {
  if (!(await hasOnlineLlmConnection())) {
    await setFlash(
      "No online LLM connection is available. Configure a reachable provider before running AI review.",
      "error",
    );
    revalidatePath("/content/experiences");
    redirect("/content/experiences");
  }

  const experiences = await getExperienceListRecords();
  let queued = 0;
  let skipped = 0;

  for (const experience of experiences) {
    const result = await queueExperienceAiReview(experience.id);
    if (result === "queued") {
      queued += 1;
    } else {
      skipped += 1;
    }
  }

  if (queued === 0) {
    await setFlash(
      skipped > 0
        ? "No new AI reviews were queued because every experience is already active."
        : "No experiences are available to review.",
      "info",
    );
  } else {
    startQueuedLlmTaskProcessing();
    await setFlash(
      skipped > 0
        ? `Queued AI review for ${queued} experience${queued === 1 ? "" : "s"}; skipped ${skipped} active review${skipped === 1 ? "" : "s"}.`
        : `Queued AI review for ${queued} experience${queued === 1 ? "" : "s"}.`,
    );
  }

  revalidatePath("/content/experiences");
  revalidatePath("/tasks");
  redirect("/content/experiences");
}

function isReviewContentType(value: string): value is AiReviewContentType {
  return value === "experience" || value === "project" || value === "case_study";
}

/**
 * Overview "Update Review" — enqueue an AI review for one record (any content
 * type). Duplicate-active tasks are skipped by `queueContentAiReview`.
 */
export async function updateRecordAiReviewAction(formData: FormData): Promise<void> {
  const id = text(formData, "id");
  const contentType = text(formData, "contentType");

  if (!isReviewContentType(contentType) || !id) {
    await setFlash("Invalid AI review request.", "error");
    redirect("/");
  }

  if (!(await hasOnlineLlmConnection())) {
    await setFlash(
      "No online LLM connection is available. Configure a reachable provider before running AI review.",
      "error",
    );
    redirect("/");
  }

  const result = await queueContentAiReview(contentType, id);

  if (result === "missing") {
    await setFlash(`${contentLabel(contentType)} not found.`, "error");
  } else if (result === "skipped") {
    await setFlash("AI review is already queued or processing for this record.", "info");
  } else {
    startQueuedLlmTaskProcessing();
    await setFlash("AI review queued");
  }

  refreshContent(contentType, id);
  redirect("/");
}

/**
 * Overview "Update All AI Reviews" — enqueue reviews for every record that is
 * stale, never reviewed, or failed. Records already queued/processing are
 * skipped. The worker processes them one at a time.
 */
export async function updateAllStaleAiReviewsAction(_formData: FormData): Promise<void> {
  if (!(await hasOnlineLlmConnection())) {
    await setFlash(
      "No online LLM connection is available. Configure a reachable provider before running AI review.",
      "error",
    );
    redirect("/");
  }

  const content = await getAdminContentIndex();
  const targets = selectStaleReviewTargets([
    ...content.experiences.map((record) => toReviewFreshnessRecord("experience", record)),
    ...content.projects.map((record) => toReviewFreshnessRecord("project", record)),
    ...content.caseStudies.map((record) => toReviewFreshnessRecord("case_study", record)),
  ]);

  let queued = 0;
  let skipped = 0;

  for (const target of targets) {
    const result = await queueContentAiReview(target.contentType, target.id);
    if (result === "queued") {
      queued += 1;
    } else {
      skipped += 1;
    }
  }

  logLlmTaskEvent("bulk_queued", { detail: `queued=${queued} skipped=${skipped}` });

  if (queued > 0) {
    startQueuedLlmTaskProcessing();
  }

  await setFlash(describeBulkEnqueue({ queued, skipped }), queued > 0 ? "success" : "info");
  revalidatePath("/");
  revalidatePath("/content/experiences");
  revalidatePath("/content/projects");
  revalidatePath("/content/case-studies");
  revalidatePath("/tasks");
  redirect("/");
}

function toReviewFreshnessRecord(
  contentType: AiReviewContentType,
  record: { id: string; aiReviewStatus: string; lastAiReviewAt: Date | null; updatedAt: Date },
): {
  id: string;
  contentType: AiReviewContentType;
  aiReviewStatus: string;
  lastAiReviewAt: Date | null;
  updatedAt: Date;
} {
  return {
    id: record.id,
    contentType,
    aiReviewStatus: record.aiReviewStatus,
    lastAiReviewAt: record.lastAiReviewAt,
    updatedAt: record.updatedAt,
  };
}

export async function createProjectDraftAction(_formData: FormData): Promise<void> {
  const id = await createProject(parseDraftProject());

  await setFlash("Draft created");
  refreshContent("project", id);
  redirect(contentEditPath("project", id));
}

export async function createCaseStudyDraftAction(_formData: FormData): Promise<void> {
  const id = await createCaseStudy(parseDraftCaseStudy());

  await setFlash("Draft created");
  refreshContent("case_study", id);
  redirect(contentEditPath("case_study", id));
}

export async function duplicateProjectAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  const source = await getProjectById(id);

  if (!source) {
    await setFlash("Project not found.", "error");
    redirect(contentListPath("project"));
  }

  const duplicateId = await createProject(
    createProjectSchema.parse({
      slug: draftSlug("project"),
      name: source.name,
      description: source.description,
      details: source.details,
      architecture: source.architecture,
      developmentTechStack: source.developmentTechStack,
      qaTechStack: source.qaTechStack,
      aiIntegrationTechStack: source.aiIntegrationTechStack,
      deploymentTechStack: source.deploymentTechStack,
      status: "draft",
      url: source.url ?? "",
      githubUrl: source.githubUrl ?? "",
      seoTitle: source.seoTitle ?? "",
      seoDescription: source.seoDescription ?? "",
      ogImage: source.ogImage ?? "",
      experienceId: source.experienceId ?? "",
      lensIds: source.lensIds,
      principleIds: source.principleIds,
      skillIds: source.skillIds,
      tagIds: source.tagIds,
      position: source.position,
      startDate: source.startDate ?? "",
      endDate: source.endDate ?? "",
    }),
  );

  await setFlash("Draft duplicate created");
  refreshContent("project", duplicateId);
  redirect(contentEditPath("project", duplicateId));
}

export async function duplicateCaseStudyAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  const source = await getCaseStudyById(id);

  if (!source) {
    await setFlash("Case study not found.", "error");
    redirect(contentListPath("case_study"));
  }

  const duplicateId = await createCaseStudy(
    createCaseStudySchema.parse({
      slug: draftSlug("case-study"),
      title: source.title,
      excerpt: source.excerpt,
      status: "draft",
      seoTitle: source.seoTitle ?? "",
      seoDescription: source.seoDescription ?? "",
      ogImage: source.ogImage ?? "",
      context: source.context,
      problem: source.problem,
      constraints: source.constraints,
      action: source.action,
      tradeoffs: source.tradeoffs,
      outcome: source.outcome,
      learning: source.learning,
      lensIds: source.lensIds,
      principleIds: source.principleIds,
      experienceIds: source.experienceIds,
      projectIds: source.projectIds,
      skillIds: source.skillIds,
      tagIds: source.tagIds,
      position: source.position,
    }),
  );

  await setFlash("Draft duplicate created");
  refreshContent("case_study", duplicateId);
  redirect(contentEditPath("case_study", duplicateId));
}

export async function publishProjectAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  const fallback = contentEditPath("project", id);
  const redirectTo = safeRedirectTarget(text(formData, "redirectTo"), fallback);
  const result = await publishProjectRecord(id);

  if (!result.ok) {
    await setFlash(result.message, "error");
    redirect(fallback);
  }

  await setFlash("Project published");
  refreshContent("project", id);
  redirect(redirectTo);
}

export async function publishCaseStudyAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  const fallback = contentEditPath("case_study", id);
  const redirectTo = safeRedirectTarget(text(formData, "redirectTo"), fallback);
  const result = await publishCaseStudyRecord(id);

  if (!result.ok) {
    await setFlash(result.message, "error");
    redirect(fallback);
  }

  await setFlash("Case study published");
  refreshContent("case_study", id);
  redirect(redirectTo);
}

export async function unpublishProjectAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  const redirectTo = safeRedirectTarget(text(formData, "redirectTo"), contentEditPath("project", id));

  await patchProject({ id, set: { status: "draft" } });
  await setFlash("Project moved back to draft");
  refreshContent("project", id);
  redirect(redirectTo);
}

export async function unpublishCaseStudyAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  const redirectTo = safeRedirectTarget(
    text(formData, "redirectTo"),
    contentEditPath("case_study", id),
  );

  await patchCaseStudy({ id, set: { status: "draft" } });
  await setFlash("Case study moved back to draft");
  refreshContent("case_study", id);
  redirect(redirectTo);
}

export async function archiveProjectAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  const redirectTo = safeRedirectTarget(text(formData, "redirectTo"), contentEditPath("project", id));

  await patchProject({ id, set: { status: "archived" } });
  await setFlash("Project archived");
  refreshContent("project", id);
  redirect(redirectTo);
}

export async function archiveCaseStudyAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  const redirectTo = safeRedirectTarget(
    text(formData, "redirectTo"),
    contentEditPath("case_study", id),
  );

  await patchCaseStudy({ id, set: { status: "archived" } });
  await setFlash("Case study archived");
  refreshContent("case_study", id);
  redirect(redirectTo);
}

export async function setProjectStatusAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  const nextStatus = contentStatusSchema.parse(status(formData));
  const redirectTo = safeRedirectTarget(text(formData, "redirectTo"), contentEditPath("project", id));

  if (nextStatus === "published") {
    const result = await publishProjectRecord(id);

    if (!result.ok) {
      await setFlash(result.message, "error");
      redirect(contentEditPath("project", id));
    }

    await setFlash("Project published");
    refreshContent("project", id);
    redirect(redirectTo);
  }

  await patchProject({ id, set: { status: nextStatus } });
  await setFlash(nextStatus === "archived" ? "Project archived" : "Project saved as draft");
  refreshContent("project", id);
  redirect(redirectTo);
}

export async function setCaseStudyStatusAction(formData: FormData): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  const nextStatus = contentStatusSchema.parse(status(formData));
  const redirectTo = safeRedirectTarget(
    text(formData, "redirectTo"),
    contentEditPath("case_study", id),
  );

  if (nextStatus === "published") {
    const result = await publishCaseStudyRecord(id);

    if (!result.ok) {
      await setFlash(result.message, "error");
      redirect(contentEditPath("case_study", id));
    }

    await setFlash("Case study published");
    refreshContent("case_study", id);
    redirect(redirectTo);
  }

  await patchCaseStudy({ id, set: { status: nextStatus } });
  await setFlash(nextStatus === "archived" ? "Case study archived" : "Case study saved as draft");
  refreshContent("case_study", id);
  redirect(redirectTo);
}

async function runSingleContentAiReview(
  contentType: EditorialContentType,
  formData: FormData,
): Promise<void> {
  const { id } = idInputSchema.parse({ id: text(formData, "id") });
  const redirectTo = safeRedirectTarget(text(formData, "redirectTo"), contentEditPath(contentType, id));

  if (!(await hasOnlineLlmConnection())) {
    await setFlash(
      "No online LLM connection is available. Configure a reachable provider before running AI review.",
      "error",
    );
    refreshContent(contentType, id);
    redirect(redirectTo);
  }

  const result = await queueContentAiReview(contentType, id);

  if (result === "missing") {
    await setFlash(`${contentLabel(contentType)} not found.`, "error");
  } else if (result === "skipped") {
    await setFlash(
      `AI review is already queued or processing for this ${contentLabel(contentType).toLowerCase()}.`,
      "info",
    );
  } else {
    await setFlash("AI review queued");
    startQueuedLlmTaskProcessing();
  }

  refreshContent(contentType, id);
  redirect(redirectTo);
}

async function runAllContentAiReviews(
  contentType: Extract<EditorialContentType, "project" | "case_study">,
): Promise<void> {
  const listPath = contentListPath(contentType);

  if (!(await hasOnlineLlmConnection())) {
    await setFlash(
      "No online LLM connection is available. Configure a reachable provider before running AI review.",
      "error",
    );
    revalidatePath(listPath);
    redirect(listPath);
  }

  const records =
    contentType === "project" ? await getAllProjects() : await getAllCaseStudies();
  let queued = 0;
  let skipped = 0;

  for (const record of records) {
    const result = await queueContentAiReview(contentType, record.id);
    if (result === "queued") {
      queued += 1;
    } else {
      skipped += 1;
    }
  }

  const singularLabel = contentType === "project" ? "project" : "case study";
  const pluralLabel = contentType === "project" ? "projects" : "case studies";

  if (queued === 0) {
    await setFlash(
      skipped > 0
        ? `No new AI reviews were queued because every ${singularLabel} is already active.`
        : `No ${pluralLabel} are available to review.`,
      "info",
    );
  } else {
    startQueuedLlmTaskProcessing();
    await setFlash(
      skipped > 0
        ? `Queued AI review for ${queued} ${queued === 1 ? singularLabel : pluralLabel}; skipped ${skipped} active review${skipped === 1 ? "" : "s"}.`
        : `Queued AI review for ${queued} ${queued === 1 ? singularLabel : pluralLabel}.`,
    );
  }

  revalidatePath(listPath);
  revalidatePath("/tasks");
  redirect(listPath);
}

export async function runProjectAiReviewAction(formData: FormData): Promise<void> {
  await runSingleContentAiReview("project", formData);
}

export async function runCaseStudyAiReviewAction(formData: FormData): Promise<void> {
  await runSingleContentAiReview("case_study", formData);
}

export async function runAllProjectAiReviewsAction(_formData: FormData): Promise<void> {
  await runAllContentAiReviews("project");
}

export async function runAllCaseStudyAiReviewsAction(_formData: FormData): Promise<void> {
  await runAllContentAiReviews("case_study");
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
      startDate: text(formData, "startDate"),
      endDate: text(formData, "endDate")
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
      startDate: text(formData, "startDate"),
      endDate: text(formData, "endDate")
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
  revalidatePath(`${options.listPath}/${id}/preview`);
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
      "startDate",
      "endDate",
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

// ---------------------------------------------------------------------------
// Resume file. Uploads replace the stored file (single-row table); the public
// site streams it from /resume. Validation rules live in @portfolio/validators
// so they are unit-tested and shared.
// ---------------------------------------------------------------------------

export async function uploadResumeAction(formData: FormData): Promise<void> {
  const file = formData.get("resume");

  if (!(file instanceof File) || file.size === 0) {
    await setFlash("Choose a resume file to upload.", "error");
    redirect("/content/contact-profile");
  }

  const validation = validateResumeFile({ name: file.name, type: file.type, size: file.size });

  if (!validation.ok) {
    await setFlash(validation.reason, "error");
    redirect("/content/contact-profile");
  }

  await setContactResume({
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    data: Buffer.from(await file.arrayBuffer()),
  });

  await setFlash("Resume uploaded");
  revalidatePath("/contact");
  refresh("/content/contact-profile");
  redirect("/content/contact-profile");
}

export async function deleteResumeAction(_formData: FormData): Promise<void> {
  await clearContactResume();

  await setFlash("Resume removed");
  revalidatePath("/contact");
  refresh("/content/contact-profile");
  redirect("/content/contact-profile");
}
