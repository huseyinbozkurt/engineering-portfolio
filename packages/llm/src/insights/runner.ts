import type { PortfolioInsightInput, PortfolioInsightOutput } from "@portfolio/validators";

import type { LLMAdapter, LLMGenerationSettings, LLMUsage } from "../adapters/types";
import { LlmHttpError } from "../adapters/http";
import {
  PORTFOLIO_INSIGHT_PROMPT_V4,
  getInsightPromptVersion,
  latestInsightPromptVersion,
} from "./prompt";
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
  /** Validation stage that rejected this attempt's output, if any. */
  validationErrorStage?: string | null;
  /** Raw model text for an attempt rejected by validation (debugging retries). */
  rawResponse?: string | null;
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
  /**
   * Total attempts including the first call — covers transient transport errors
   * AND schema-validation failures (a fresh generation is the remedy for both).
   * Default 3.
   */
  maxAttempts?: number;
  /**
   * Per-call generation overrides forwarded to the adapter. Unset fields fall
   * back to the adapter's defaults (the structured-JSON profile / env config).
   */
  generation?: LLMGenerationSettings;
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
    maxAttempts = 3,
    generation,
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

  // One attempt = generate → validate. A transient transport error (timeout,
  // 5xx, 429) OR a schema/JSON/evidence validation failure is retried with a
  // fresh generation until attempts are exhausted; non-transient transport
  // errors fail fast. Every attempt's outcome (including the failing validation
  // stage and the raw text it produced) is recorded for the debug view.
  const generateParams = {
    systemPrompt: prompt.system,
    userPrompt: prompt.user,
    schema: "json" as const,
    ...(generation ? { generation } : {}),
  };

  let response: Awaited<ReturnType<LLMAdapter["generate"]>> | null = null;
  let validated: ReturnType<typeof validateInsightOutput> | null = null;
  let lastRequestError: Error | null = null;

  for (let attemptNo = 1; attemptNo <= maxAttempts; attemptNo += 1) {
    const attemptStartedAt = new Date();
    logger.event("request-started", { provider, model, attemptNo });

    let attemptResponse: Awaited<ReturnType<LLMAdapter["generate"]>>;
    try {
      attemptResponse = await adapter.generate(generateParams);
    } catch (error) {
      const message = error instanceof Error ? error.message : "LLM request failed.";

      // Include LLM provider error details if available.
      let detailedMessage = message;
      if (error instanceof LlmHttpError && error.details) {
        detailedMessage += `\n\nProvider details: ${String(error.details)}`;
      }

      lastRequestError = error instanceof Error ? error : new Error(message);
      attempts.push({
        attemptNo,
        provider,
        model,
        startedAt: attemptStartedAt.toISOString(),
        completedAt: new Date().toISOString(),
        errorMessage: detailedMessage,
      });
      logger.error("request-failed", { attemptNo, message, transient: isTransient(error) });

      if (attemptNo < maxAttempts && isTransient(error)) {
        await sleep(retryDelayMs);
        continue;
      }
      // Non-transient, or retries exhausted: the request stage is terminal.
      return finishFailed("request", lastRequestError.message, null);
    }

    logger.event("response-received", {
      attemptNo,
      textChars: attemptResponse.text.length,
      finishReason: attemptResponse.finishReason ?? null,
      usage: attemptResponse.usage ?? null,
    });

    try {
      const attemptValidated = validateInsightOutput(attemptResponse.text, input, {
        requireHomePageContent: promptVersion === PORTFOLIO_INSIGHT_PROMPT_V4,
      });
      attempts.push({
        attemptNo,
        provider,
        model,
        startedAt: attemptStartedAt.toISOString(),
        completedAt: new Date().toISOString(),
        errorMessage: null,
        usage: attemptResponse.usage ?? null,
      });
      response = attemptResponse;
      validated = attemptValidated;
      break;
    } catch (error) {
      const stage = error instanceof InsightValidationError ? error.stage : "validation";
      const message = error instanceof Error ? error.message : "Validation failed.";
      attempts.push({
        attemptNo,
        provider,
        model,
        startedAt: attemptStartedAt.toISOString(),
        completedAt: new Date().toISOString(),
        errorMessage: message,
        usage: attemptResponse.usage ?? null,
        validationErrorStage: stage,
        rawResponse: attemptResponse.text,
      });
      logger.error("validation-failed", {
        stage,
        message,
        attemptNo,
        willRetry: attemptNo < maxAttempts,
      });

      if (attemptNo < maxAttempts) {
        await sleep(retryDelayMs);
        continue;
      }
      // Retries exhausted: persist the last raw output and the failing stage.
      return finishFailed(stage, message, attemptResponse.text);
    }
  }

  // Every terminal path inside the loop returns, so a null here is a logic
  // error rather than an expected outcome — fail closed rather than persist a
  // half-built run.
  if (!response || !validated) {
    return finishFailed(
      "request",
      lastRequestError?.message ?? "Insight run produced no usable result.",
      null,
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
