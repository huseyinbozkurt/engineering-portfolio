import {
  portfolioInsightInputSchema,
  portfolioInsightOutputSchema,
  type PortfolioInsightInput,
  type PortfolioInsightOutput,
} from "@portfolio/validators";

import { getInsightPromptVersion, latestInsightPromptVersion } from "../insights/prompt";
import type { RegisteredTask } from "./types";

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
