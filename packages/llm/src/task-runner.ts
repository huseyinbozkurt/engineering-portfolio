import {
  claimNextPendingLlmTask,
  recoverStuckLlmTasks,
  updateLlmTask,
  type LlmTaskRecord,
} from "@portfolio/db/llm-tasks";
import { logLlmTaskEvent } from "@portfolio/db/llm-task-log";
import { STUCK_TASK_ERROR_MESSAGE } from "@portfolio/db/llm-task-scheduling";
import {
  saveContentAiReviewFailure,
  saveContentAiReviewSuccess,
  setContentAiReviewProcessing,
  type AiReviewContentType,
} from "@portfolio/db/content-ai-review";

import { getCaseStudyById, getExperienceById, getProjectById } from "@portfolio/db/queries";

import { resolveOnlineLlmAdapter } from "./adapters/online";
import type { LLMAdapter } from "./adapters/types";
import {
  buildExperienceAiReviewPrompt,
  buildContentAiReviewPrompt,
  caseStudyAiReviewTaskType,
  type ContentAiReviewInput,
  ExperienceAiReviewValidationError,
  experienceAiReviewTaskType,
  parseExperienceAiReviewOutput,
  projectAiReviewTaskType,
  type ExperienceAiReviewInput,
} from "./experiences/ai-review";

export function setGlobalDb(_db: unknown): void {
  // Compatibility shim for the worker entry point. The DB package owns its
  // global connection cache, so no explicit injection is needed here.
}

let activeQueuedTaskRun: Promise<number> | null = null;

export function startQueuedLlmTaskProcessing(options: { db?: unknown } = {}): boolean {
  if (activeQueuedTaskRun) {
    return false;
  }

  activeQueuedTaskRun = new Promise<number>((resolve) => {
    setTimeout(() => {
      void processQueuedLlmTasks(options).then(resolve, (error) => {
        console.error("[llm-tasks] background task processing failed:", error);
        resolve(0);
      });
    }, 0);
  }).finally(() => {
    activeQueuedTaskRun = null;
  });

  return true;
}

export async function processQueuedLlmTasks(options: { db?: unknown } = {}): Promise<number> {
  let processedCount = 0;

  while (true) {
    const taskId = await processNextPendingTask(options);

    if (!taskId) {
      return processedCount;
    }

    processedCount += 1;
  }
}

export async function processNextPendingTask(_options: { db?: unknown } = {}): Promise<string | null> {
  // Free the single concurrency slot from any crashed/hung task first, so the
  // queue never deadlocks waiting on a zombie "running" row.
  await recoverStuckContentReviewTasks();

  const resolved = await resolveOnlineLlmAdapter();

  if (!resolved) {
    return null;
  }

  const task = await claimNextPendingLlmTask();

  if (!task) {
    return null;
  }

  if (isContentAiReviewTaskType(task.taskType)) {
    await processContentAiReviewTask(task, resolved.adapter);
    return task.id;
  }

  logLlmTaskEvent("failed", { ...taskLogFields(task), detail: "unknown_task_type" });
  await updateLlmTask(task.id, {
    status: "failed",
    errorStage: "task_type",
    errorMessage: `Unknown LLM task type: ${task.taskType}`,
    completedAt: new Date(),
  });

  return task.id;
}

/**
 * Mark crashed/hung `running` tasks failed and sync their content record out of
 * "processing" so it shows as failed and can be re-queued. Runs once per worker
 * tick before claiming the next task.
 */
async function recoverStuckContentReviewTasks(): Promise<void> {
  const recovered = await recoverStuckLlmTasks();

  for (const task of recovered) {
    const contentType = contentTypeForTask(task);
    if (contentType && task.targetId) {
      await saveContentAiReviewFailure(contentType, task.targetId, STUCK_TASK_ERROR_MESSAGE);
    }
  }
}

function taskLogFields(task: LlmTaskRecord): {
  id: string;
  taskType: string;
  targetType: string | null;
  targetId: string | null;
  attempts: number;
} {
  return {
    id: task.id,
    taskType: task.taskType,
    targetType: task.targetType,
    targetId: task.targetId,
    attempts: task.attempts,
  };
}

async function processContentAiReviewTask(
  task: LlmTaskRecord,
  adapter: LLMAdapter,
): Promise<void> {
  const startedAt = new Date();
  const contentId = task.targetId;
  const contentType = contentTypeForTask(task);

  if (!contentId || !contentType) {
    await failTask(task, "target", "Content AI review task is missing a valid target.", startedAt);
    return;
  }

  await setContentAiReviewProcessing(contentType, contentId);
  logLlmTaskEvent("started", taskLogFields(task));

  try {
    await updateLlmTask(task.id, {
      providerName: adapter.getProvider(),
      providerModel: adapter.getModel() ?? null,
    });

    const prompt = await getTaskPrompt(task, contentType, contentId);
    const response = await adapter.generate({
      systemPrompt: prompt.system,
      userPrompt: prompt.user,
      schema: "json",
    });
    let output;
    try {
      output = parseExperienceAiReviewOutput(response.text);
    } catch (error) {
      const stage = error instanceof ExperienceAiReviewValidationError ? error.stage : "schema";
      const message = error instanceof Error ? error.message : "Experience AI review validation failed.";

      await saveContentAiReviewFailure(contentType, contentId, message);
      logLlmTaskEvent("failed", { ...taskLogFields(task), detail: stage });
      await updateLlmTask(task.id, {
        status: "failed",
        providerName: adapter.getProvider(),
        providerModel: adapter.getModel() ?? null,
        rawResponse: response.text,
        finishReason: response.finishReason ?? null,
        errorStage: stage,
        errorMessage: message,
        completedAt: new Date(),
        durationMs: Date.now() - startedAt.getTime(),
      });
      return;
    }

    await saveContentAiReviewSuccess(contentType, contentId, output);
    logLlmTaskEvent("completed", taskLogFields(task));
    await updateLlmTask(task.id, {
      status: "succeeded",
      providerName: adapter.getProvider(),
      providerModel: adapter.getModel() ?? null,
      rawResponse: response.text,
      parsedResponse: output,
      finishReason: response.finishReason ?? null,
      errorStage: null,
      errorMessage: null,
      completedAt: new Date(),
      durationMs: Date.now() - startedAt.getTime(),
    });
  } catch (error) {
    const stage = error instanceof ExperienceAiReviewValidationError ? error.stage : "request";
    const message = error instanceof Error ? error.message : "Experience AI review failed.";

    await failContentReviewTask(task, contentType, contentId, stage, message, startedAt);
  }
}

async function getTaskPrompt(
  task: LlmTaskRecord,
  contentType: AiReviewContentType,
  contentId: string,
): Promise<{ system: string; user: string }> {
  if (task.promptSystem.trim() && task.promptUser.trim()) {
    return {
      system: task.promptSystem,
      user: task.promptUser,
    };
  }

  if (contentType === "experience") {
    const experience = await getExperienceById(contentId);

    if (!experience) {
      throw new Error("Experience record was not found.");
    }

    return buildExperienceAiReviewPrompt(toExperienceAiReviewInput(experience));
  }

  return buildContentAiReviewPrompt(await toContentAiReviewInput(contentType, contentId));
}

async function failContentReviewTask(
  task: LlmTaskRecord,
  contentType: AiReviewContentType,
  contentId: string,
  stage: string,
  message: string,
  startedAt: Date,
): Promise<void> {
  await saveContentAiReviewFailure(contentType, contentId, message);
  await failTask(task, stage, message, startedAt);
}

async function failTask(
  task: LlmTaskRecord,
  stage: string,
  message: string,
  startedAt: Date,
): Promise<void> {
  logLlmTaskEvent("failed", { ...taskLogFields(task), detail: stage });
  await updateLlmTask(task.id, {
    status: "failed",
    errorStage: stage,
    errorMessage: message,
    completedAt: new Date(),
    durationMs: Date.now() - startedAt.getTime(),
  });
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

async function toContentAiReviewInput(
  contentType: AiReviewContentType,
  id: string,
): Promise<ContentAiReviewInput> {
  if (contentType === "project") {
    const project = await getProjectById(id);

    if (!project) {
      throw new Error("Project record was not found.");
    }

    return {
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
    };
  }

  const caseStudy = await getCaseStudyById(id);

  if (!caseStudy) {
    throw new Error("Case study record was not found.");
  }

  return {
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
  };
}

function isContentAiReviewTaskType(taskType: string): boolean {
  return [
    experienceAiReviewTaskType,
    projectAiReviewTaskType,
    caseStudyAiReviewTaskType,
  ].includes(taskType);
}

function contentTypeForTask(task: LlmTaskRecord): AiReviewContentType | null {
  if (task.targetType === "experience" || task.taskType === experienceAiReviewTaskType) {
    return "experience";
  }

  if (task.targetType === "project" || task.taskType === projectAiReviewTaskType) {
    return "project";
  }

  if (task.targetType === "case_study" || task.taskType === caseStudyAiReviewTaskType) {
    return "case_study";
  }

  return null;
}
