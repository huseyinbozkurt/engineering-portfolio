import {
  experienceAiReviewOutputSchema,
  portfolioInsightInputSchema,
  portfolioInsightOutputSchema,
  type ExperienceAiReviewOutput,
  type PortfolioInsightInput,
  type PortfolioInsightOutput,
} from "@portfolio/validators";
import { z } from "zod";

import {
  buildContentAiReviewPrompt,
  buildExperienceAiReviewPrompt,
  caseStudyAiReviewTaskType,
  projectAiReviewTaskType,
  experienceAiReviewTaskType,
  latestExperienceAiReviewPromptVersion,
  latestContentAiReviewPromptVersion,
  type ContentAiReviewInput,
  type ExperienceAiReviewInput,
} from "../experiences/ai-review";
import { getInsightPromptVersion, latestInsightPromptVersion } from "../insights/prompt";
import type { RegisteredTask } from "./types";

const experienceAiReviewInputSchema = z
  .object({
    id: z.string().uuid(),
    status: z.string(),
    slug: z.string().nullable(),
    company: z.string(),
    role: z.string(),
    location: z.string().nullable(),
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
    isCurrent: z.boolean(),
    summary: z.string(),
    details: z.string(),
    awards: z.string(),
  })
  .strict();

const contentAiReviewInputSchema = z
  .object({
    entityType: z.enum(["project", "case_study"]),
    id: z.string().uuid(),
    status: z.string(),
    slug: z.string().nullable(),
    title: z.string(),
    fields: z.record(z.unknown()),
    relations: z.record(z.union([z.array(z.string()), z.string(), z.null()])).optional(),
  })
  .strict();

/**
 * Registry of available LLM task types. Each entry binds the strict input /
 * output schemas to the latest prompt version; historical runs keep the
 * version string they were generated with.
 */
export const taskRegistry = {
  portfolio_insight: {
    type: "portfolio_insight",
    promptVersion: latestInsightPromptVersion,
    inputSchema: portfolioInsightInputSchema,
    outputSchema: portfolioInsightOutputSchema,
    buildPrompt(input: PortfolioInsightInput) {
      return getInsightPromptVersion(latestInsightPromptVersion).build(input);
    },
  } satisfies RegisteredTask<PortfolioInsightInput, PortfolioInsightOutput>,
  experience_ai_review: {
    type: experienceAiReviewTaskType,
    promptVersion: latestExperienceAiReviewPromptVersion,
    inputSchema: experienceAiReviewInputSchema,
    outputSchema: experienceAiReviewOutputSchema,
    buildPrompt(input: ExperienceAiReviewInput) {
      return buildExperienceAiReviewPrompt(input);
    },
  } satisfies RegisteredTask<ExperienceAiReviewInput, ExperienceAiReviewOutput>,
  project_ai_review: {
    type: projectAiReviewTaskType,
    promptVersion: latestContentAiReviewPromptVersion,
    inputSchema: contentAiReviewInputSchema,
    outputSchema: experienceAiReviewOutputSchema,
    buildPrompt(input: ContentAiReviewInput) {
      return buildContentAiReviewPrompt(input);
    },
  } satisfies RegisteredTask<ContentAiReviewInput, ExperienceAiReviewOutput>,
  case_study_ai_review: {
    type: caseStudyAiReviewTaskType,
    promptVersion: latestContentAiReviewPromptVersion,
    inputSchema: contentAiReviewInputSchema,
    outputSchema: experienceAiReviewOutputSchema,
    buildPrompt(input: ContentAiReviewInput) {
      return buildContentAiReviewPrompt(input);
    },
  } satisfies RegisteredTask<ContentAiReviewInput, ExperienceAiReviewOutput>,
} as const;

export type TaskType = keyof typeof taskRegistry;

export function getRegisteredTask<T extends TaskType>(type: T): (typeof taskRegistry)[T] {
  const task = taskRegistry[type];
  if (!task) {
    throw new Error(`Unknown task type: ${type}`);
  }
  return task;
}

export function listAvailableTasks(): TaskType[] {
  return Object.keys(taskRegistry) as TaskType[];
}
