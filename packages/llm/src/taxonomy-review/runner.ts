import type { TaxonomyReviewInput, TaxonomyReviewOutput } from "@portfolio/validators";

import { LlmHttpError } from "../adapters/http";
import type { LLMAdapter, LLMUsage } from "../adapters/types";
import {
  getTaxonomyReviewPromptVersion,
  latestTaxonomyReviewPromptVersion,
} from "./prompt";
import {
  TaxonomyReviewValidationError,
  validateTaxonomyReviewOutput,
} from "./validate";

export interface TaxonomyReviewRunAttempt {
  attemptNo: number;
  provider: string;
  model: string | null;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  usage?: LLMUsage | null;
}

export interface TaxonomyReviewRunStore {
  update(
    id: string,
    patch: {
      status?: "failed";
      provider?: string | null;
      model?: string | null;
      rawResponse?: string | null;
      validationNotes?: string[];
      tokenUsage?: LLMUsage | null;
      attempts?: TaxonomyReviewRunAttempt[];
      errorStage?: string | null;
      errorMessage?: string | null;
      completedAt?: Date | null;
      durationMs?: number | null;
    },
  ): Promise<unknown>;
  complete(
    id: string,
    patch: {
      status: "succeeded";
      provider?: string | null;
      model?: string | null;
      rawResponse?: string | null;
      outputJson?: TaxonomyReviewOutput;
      validationNotes?: string[];
      tokenUsage?: LLMUsage | null;
      attempts?: TaxonomyReviewRunAttempt[];
      errorStage?: string | null;
      errorMessage?: string | null;
      completedAt?: Date | null;
      durationMs?: number | null;
      generatedAt?: Date | null;
    },
    suggestions: TaxonomyReviewOutput["suggestions"],
  ): Promise<unknown>;
}

export interface RunTaxonomyReviewOptions {
  runId: string;
  input: TaxonomyReviewInput;
  adapter: LLMAdapter;
  store: TaxonomyReviewRunStore;
  promptVersion?: string;
  startedAt?: Date;
  maxAttempts?: number;
  sleep?: (ms: number) => Promise<void>;
  retryDelayMs?: number;
}

export interface RunTaxonomyReviewResult {
  status: "succeeded" | "failed";
  errorStage?: string;
}

export async function runTaxonomyReview(
  options: RunTaxonomyReviewOptions,
): Promise<RunTaxonomyReviewResult> {
  const {
    runId,
    input,
    adapter,
    store,
    promptVersion = latestTaxonomyReviewPromptVersion,
    startedAt = new Date(),
    maxAttempts = 2,
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    retryDelayMs = 1500,
  } = options;

  const attempts: TaxonomyReviewRunAttempt[] = [];
  const provider = adapter.getProvider();
  const model = adapter.getModel() ?? null;

  const finishFailed = async (
    stage: string,
    message: string,
    rawResponse: string | null,
  ): Promise<RunTaxonomyReviewResult> => {
    const completedAt = new Date();
    try {
      await store.update(runId, {
        status: "failed",
        provider,
        model,
        rawResponse,
        attempts,
        errorStage: stage,
        errorMessage: message,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
      });
    } catch {
      // The run may have been cancelled or superseded; the admin page still
      // shows the last persisted state.
    }
    return { status: "failed", errorStage: stage };
  };

  let prompt: { system: string; user: string };
  try {
    prompt = getTaxonomyReviewPromptVersion(promptVersion).build(input);
  } catch (error) {
    return finishFailed(
      "prompt",
      error instanceof Error ? error.message : "Prompt build failed.",
      null,
    );
  }

  let response: Awaited<ReturnType<LLMAdapter["generate"]>> | null = null;
  let lastError: Error | null = null;

  for (let attemptNo = 1; attemptNo <= maxAttempts; attemptNo += 1) {
    const attemptStartedAt = new Date();
    try {
      response = await adapter.generate({
        systemPrompt: prompt.system,
        userPrompt: prompt.user,
        schema: "json",
      });
      attempts.push({
        attemptNo,
        provider,
        model,
        startedAt: attemptStartedAt.toISOString(),
        completedAt: new Date().toISOString(),
        errorMessage: null,
        usage: response.usage ?? null,
      });
      break;
    } catch (error) {
      const message = error instanceof Error ? error.message : "LLM request failed.";
      lastError = error instanceof Error ? error : new Error(message);
      attempts.push({
        attemptNo,
        provider,
        model,
        startedAt: attemptStartedAt.toISOString(),
        completedAt: new Date().toISOString(),
        errorMessage: detailedErrorMessage(error, message),
      });

      if (attemptNo < maxAttempts && isTransient(error)) {
        await sleep(retryDelayMs);
        continue;
      }

      break;
    }
  }

  if (!response) {
    return finishFailed("request", lastError?.message ?? "LLM request failed.", null);
  }

  let validated;
  try {
    validated = validateTaxonomyReviewOutput(response.text, input);
  } catch (error) {
    if (error instanceof TaxonomyReviewValidationError) {
      return finishFailed(error.stage, error.message, response.text);
    }
    return finishFailed(
      "validation",
      error instanceof Error ? error.message : "Validation failed.",
      response.text,
    );
  }

  const completedAt = new Date();
  try {
    await store.complete(
      runId,
      {
        status: "succeeded",
        provider,
        model,
        rawResponse: response.text,
        outputJson: validated.output,
        validationNotes: validated.notes,
        tokenUsage: response.usage ?? null,
        attempts,
        errorStage: null,
        errorMessage: null,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        generatedAt: completedAt,
      },
      validated.output.suggestions,
    );
  } catch {
    return { status: "failed", errorStage: "persist" };
  }

  return { status: "succeeded" };
}

function detailedErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof LlmHttpError && error.details) {
    return `${fallback}\n\nProvider details: ${String(error.details)}`;
  }
  return fallback;
}

function isTransient(error: unknown): boolean {
  if (error instanceof LlmHttpError) {
    return error.timedOut || error.status === 429 || (error.status !== null && error.status >= 500);
  }
  if (error instanceof Error) {
    return /timed out|HTTP (5\d\d|429)/.test(error.message);
  }
  return false;
}
