import type { PortfolioInsightInput, PortfolioInsightOutput } from "@portfolio/validators";

import type { LLMAdapter, LLMUsage } from "../adapters/types";
import { LlmHttpError } from "../adapters/http";
import { getInsightPromptVersion, latestInsightPromptVersion } from "./prompt";
import { InsightValidationError, validateInsightOutput } from "./validate";
import { silentInsightLogger, type InsightLogger } from "./logger";

/** Attempt summary persisted on the run (jsonb) for retry auditing. */
export interface InsightRunAttempt {
  attemptNo: number;
  provider: string;
  model: string | null;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  usage?: LLMUsage | null;
}

/**
 * Persistence boundary the runner writes through. `@portfolio/db/ai-insight-runs`
 * satisfies it; tests pass an in-memory fake.
 */
export interface InsightRunStore {
  update(
    id: string,
    patch: {
      status?: "succeeded" | "failed";
      provider?: string | null;
      model?: string | null;
      rawResponse?: string | null;
      outputJson?: PortfolioInsightOutput;
      validationNotes?: string[];
      tokenUsage?: LLMUsage | null;
      attempts?: InsightRunAttempt[];
      errorStage?: string | null;
      errorMessage?: string | null;
      completedAt?: Date | null;
      durationMs?: number | null;
    },
  ): Promise<unknown>;
}

export interface RunPortfolioInsightOptions {
  runId: string;
  input: PortfolioInsightInput;
  adapter: LLMAdapter;
  store: InsightRunStore;
  promptVersion?: string;
  logger?: InsightLogger;
  startedAt?: Date;
  /** Total attempts including the first call. Default 2. */
  maxAttempts?: number;
  /** Backoff between attempts; injectable for tests. */
  sleep?: (ms: number) => Promise<void>;
  retryDelayMs?: number;
}

export interface RunPortfolioInsightResult {
  status: "succeeded" | "failed";
  errorStage?: string;
}

/**
 * Executes one insight generation run end to end: prompt → provider (with
 * timeout + bounded retry on transient failures) → staged validation →
 * persisted terminal state. Every stage emits a structured log event; every
 * attempt is recorded on the run. This function never throws — failures are
 * persisted and reported in the result.
 */
export async function runPortfolioInsight(
  options: RunPortfolioInsightOptions,
): Promise<RunPortfolioInsightResult> {
  const {
    runId,
    input,
    adapter,
    store,
    promptVersion = latestInsightPromptVersion,
    logger = silentInsightLogger,
    startedAt = new Date(),
    maxAttempts = 2,
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    retryDelayMs = 1500,
  } = options;

  const attempts: InsightRunAttempt[] = [];
  const provider = adapter.getProvider();
  const model = adapter.getModel() ?? null;

  const finishFailed = async (
    stage: string,
    message: string,
    rawResponse: string | null,
  ): Promise<RunPortfolioInsightResult> => {
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
      logger.event("saved", { status: "failed", errorStage: stage });
    } catch (persistError) {
      logger.error("saved", {
        status: "failed",
        persistError: persistError instanceof Error ? persistError.message : "unknown",
      });
    }
    return { status: "failed", errorStage: stage };
  };

  let prompt: { system: string; user: string };
  try {
    prompt = getInsightPromptVersion(promptVersion).build(input);
    logger.event("prompt-built", {
      promptVersion,
      systemChars: prompt.system.length,
      userChars: prompt.user.length,
    });
  } catch (error) {
    return finishFailed(
      "prompt",
      error instanceof Error ? error.message : "Prompt build failed.",
      null,
    );
  }

  // Provider loop with bounded retry on transient failures (timeout, 5xx, 429).
  let response: Awaited<ReturnType<LLMAdapter["generate"]>> | null = null;
  let lastError: Error | null = null;

  for (let attemptNo = 1; attemptNo <= maxAttempts; attemptNo += 1) {
    const attemptStartedAt = new Date();
    logger.event("request-started", { provider, model, attemptNo });

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
      logger.event("response-received", {
        attemptNo,
        textChars: response.text.length,
        finishReason: response.finishReason ?? null,
        usage: response.usage ?? null,
      });
      break;
    } catch (error) {
      const message = error instanceof Error ? error.message : "LLM request failed.";
      
      // Include LLM provider error details if available
      let detailedMessage = message;
      if (error instanceof LlmHttpError && error.details) {
        detailedMessage += `\n\nProvider details: ${String(error.details)}`;
      }
      
      lastError = error instanceof Error ? error : new Error(message);
      attempts.push({
        attemptNo,
        provider,
        model,
        startedAt: attemptStartedAt.toISOString(),
        completedAt: new Date().toISOString(),
        errorMessage: detailedMessage,
      });

      if (attemptNo < maxAttempts && isTransient(error)) {
        logger.event("request-started", { retryScheduled: true, afterMs: retryDelayMs });
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
    validated = validateInsightOutput(response.text, input);
  } catch (error) {
    if (error instanceof InsightValidationError) {
      logger.error("validation-failed", { stage: error.stage, message: error.message });
      return finishFailed(error.stage, error.message, response.text);
    }
    logger.error("validation-failed", {
      stage: "unknown",
      message: error instanceof Error ? error.message : "Validation failed.",
    });
    return finishFailed(
      "validation",
      error instanceof Error ? error.message : "Validation failed.",
      response.text,
    );
  }

  const completedAt = new Date();
  try {
    await store.update(runId, {
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
    });
  } catch (persistError) {
    logger.error("saved", {
      status: "succeeded",
      persistError: persistError instanceof Error ? persistError.message : "unknown",
    });
    return { status: "failed", errorStage: "persist" };
  }

  logger.event("saved", {
    status: "succeeded",
    validationNotes: validated.notes.length,
    durationMs: completedAt.getTime() - startedAt.getTime(),
  });

  return { status: "succeeded" };
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
