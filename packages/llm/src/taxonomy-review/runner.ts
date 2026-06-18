import type { TaxonomyReviewInput, TaxonomyReviewOutput } from "@portfolio/validators";

import { LlmHttpError } from "../adapters/http";
import type { LLMAdapter, LLMGenerationSettings, LLMUsage } from "../adapters/types";
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
  /** Validation stage that rejected this attempt's output, if any. */
  validationErrorStage?: string | null;
  /** Raw model text for an attempt rejected by validation (debugging retries). */
  rawResponse?: string | null;
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
  /**
   * Pre-rendered active DB prompt. The text sent to the model is exactly what
   * was persisted on the run.
   */
  prompt: { system: string; user: string };
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
    prompt,
    startedAt = new Date(),
    maxAttempts = 3,
    generation,
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

  // One attempt = generate → validate. A transient transport error OR a
  // schema/JSON/evidence validation failure is retried with a fresh generation
  // until attempts are exhausted; non-transient transport errors fail fast.
  const generateParams = {
    systemPrompt: prompt.system,
    userPrompt: prompt.user,
    schema: "json" as const,
    ...(generation ? { generation } : {}),
  };

  let response: Awaited<ReturnType<LLMAdapter["generate"]>> | null = null;
  let validated: ReturnType<typeof validateTaxonomyReviewOutput> | null = null;
  let lastRequestError: Error | null = null;

  for (let attemptNo = 1; attemptNo <= maxAttempts; attemptNo += 1) {
    const attemptStartedAt = new Date();

    let attemptResponse: Awaited<ReturnType<LLMAdapter["generate"]>>;
    try {
      attemptResponse = await adapter.generate(generateParams);
    } catch (error) {
      const message = error instanceof Error ? error.message : "LLM request failed.";
      lastRequestError = error instanceof Error ? error : new Error(message);
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
      // Non-transient, or retries exhausted: the request stage is terminal.
      return finishFailed("request", lastRequestError.message, null);
    }

    try {
      const attemptValidated = validateTaxonomyReviewOutput(attemptResponse.text, input);
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
      const stage = error instanceof TaxonomyReviewValidationError ? error.stage : "validation";
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

      if (attemptNo < maxAttempts) {
        await sleep(retryDelayMs);
        continue;
      }
      // Retries exhausted: persist the last raw output and the failing stage.
      return finishFailed(stage, message, attemptResponse.text);
    }
  }

  // Every terminal path inside the loop returns, so a null here is a logic
  // error — fail closed rather than persist a half-built run.
  if (!response || !validated) {
    return finishFailed(
      "request",
      lastRequestError?.message ?? "Taxonomy review produced no usable result.",
      null,
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
