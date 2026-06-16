import type {
  LLMAdapter,
  LLMGenerateParams,
  LLMGenerateResult,
  LLMGenerationSettings,
  LLMProvider,
  LLMUsage,
} from "./types";
import { resolveGeneration, STRUCTURED_JSON_GENERATION } from "./generation";
import { joinUrl, readNumber, readPath, timedFetch } from "./http";

export interface AnthropicAdapterConfig {
  baseUrl?: string;
  apiKey: string;
  model: string;
  timeoutMs?: number;
  /** Default completion-token ceiling; per-call `generation.maxTokens` overrides it. */
  maxTokens?: number;
  /** Default sampling temperature; per-call `generation.temperature` overrides it. */
  temperature?: number;
  /** Default nucleus-sampling cutoff; per-call `generation.topP` overrides it. */
  topP?: number;
  apiVersion?: string;
}

/**
 * Anthropic Messages API adapter. Ported from the admin's proven
 * `callAnthropic` implementation, extended with token-usage extraction
 * (`usage.input_tokens` / `usage.output_tokens`) for run metadata.
 */
export class AnthropicAdapter implements LLMAdapter {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly generationDefaults: Required<LLMGenerationSettings>;
  private readonly apiVersion: string;

  constructor(config: AnthropicAdapterConfig) {
    this.baseUrl = config.baseUrl ?? "https://api.anthropic.com/v1";
    this.apiKey = config.apiKey;
    this.model = config.model;
    // Honor the caller's timeout; the admin resolver enforces the 15-minute
    // production floor. A hardcoded value here would silently cap higher
    // configs (and break injectable timeouts in tests).
    this.timeoutMs = config.timeoutMs ?? 900000;
    // Default to the structured-JSON profile; the resolver passes env overrides,
    // and individual calls can still override per field via `params.generation`.
    this.generationDefaults = {
      temperature: config.temperature ?? STRUCTURED_JSON_GENERATION.temperature,
      topP: config.topP ?? STRUCTURED_JSON_GENERATION.topP,
      maxTokens: config.maxTokens ?? STRUCTURED_JSON_GENERATION.maxTokens,
    };
    this.apiVersion = config.apiVersion ?? "2023-06-01";
  }

  async generate(params: LLMGenerateParams): Promise<LLMGenerateResult> {
    const generation = resolveGeneration(params.generation, this.generationDefaults);
    const response = await timedFetch(
      joinUrl(this.baseUrl, "messages"),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": this.apiVersion,
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: generation.maxTokens,
          temperature: generation.temperature,
          top_p: generation.topP,
          ...(params.systemPrompt ? { system: params.systemPrompt } : {}),
          messages: [{ role: "user", content: params.userPrompt }],
        }),
      },
      this.timeoutMs,
    );

    const payload = (await response.json()) as unknown;
    const content = readPath(payload, ["content", 0, "text"]);
    const finishReason = readPath(payload, ["stop_reason"]);

    if (typeof content !== "string") {
      throw new Error("LLM response did not include text content.");
    }

    return {
      text: content,
      finishReason: typeof finishReason === "string" ? finishReason : null,
      raw: payload,
      usage: extractAnthropicUsage(payload),
    };
  }

  getProvider(): LLMProvider {
    return "anthropic";
  }

  getModel(): string | undefined {
    return this.model;
  }
}

function extractAnthropicUsage(payload: unknown): LLMUsage | undefined {
  const inputTokens = readNumber(readPath(payload, ["usage", "input_tokens"]));
  const outputTokens = readNumber(readPath(payload, ["usage", "output_tokens"]));

  if (inputTokens === undefined && outputTokens === undefined) {
    return undefined;
  }

  const usage: LLMUsage = {};
  if (inputTokens !== undefined) usage.promptTokens = inputTokens;
  if (outputTokens !== undefined) usage.completionTokens = outputTokens;
  if (inputTokens !== undefined && outputTokens !== undefined) {
    usage.totalTokens = inputTokens + outputTokens;
  }
  return usage;
}
