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

export interface OpenAiCompatibleAdapterConfig {
  /** Provider label recorded on runs; "custom" covers Ollama / MLX / LM Studio. */
  provider?: Extract<LLMProvider, "openai" | "deepseek" | "custom">;
  baseUrl: string;
  apiKey?: string | null;
  model: string;
  timeoutMs?: number;
  /** Default completion-token ceiling; per-call `generation.maxTokens` overrides it. */
  maxTokens?: number;
  /** Default sampling temperature; per-call `generation.temperature` overrides it. */
  temperature?: number;
  /** Default nucleus-sampling cutoff; per-call `generation.topP` overrides it. */
  topP?: number;
  /**
   * Whether to request `response_format: json_object`. Defaults to true for
   * hosted providers; pass false for local servers that reject the field.
   */
  jsonResponseFormat?: boolean;
}

/**
 * Adapter for any OpenAI-compatible `chat/completions` endpoint: OpenAI,
 * DeepSeek, Ollama, MLX servers, LM Studio, etc. Ported from the admin's
 * proven `callOpenAiCompatible` implementation, extended with token-usage
 * extraction for run metadata.
 */
export class OpenAiCompatibleAdapter implements LLMAdapter {
  private readonly provider: Extract<LLMProvider, "openai" | "deepseek" | "custom">;
  private readonly baseUrl: string;
  private readonly apiKey: string | null;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly generationDefaults: Required<LLMGenerationSettings>;
  private readonly jsonResponseFormat: boolean;

  constructor(config: OpenAiCompatibleAdapterConfig) {
    this.provider = config.provider ?? "custom";
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey ?? null;
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
    this.jsonResponseFormat = config.jsonResponseFormat ?? this.provider !== "custom";
  }

  async generate(params: LLMGenerateParams): Promise<LLMGenerateResult> {
    const generation = resolveGeneration(params.generation, this.generationDefaults);
    const response = await timedFetch(
      joinUrl(this.baseUrl, "chat/completions"),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: this.model,
          temperature: generation.temperature,
          top_p: generation.topP,
          max_tokens: generation.maxTokens,
          messages: [
            ...(params.systemPrompt
              ? [{ role: "system", content: params.systemPrompt }]
              : []),
            { role: "user", content: params.userPrompt },
          ],
          response_format: this.jsonResponseFormat ? { type: "json_object" } : undefined,
        }),
      },
      this.timeoutMs,
    );

    const payload = (await response.json()) as unknown;
    const content = readPath(payload, ["choices", 0, "message", "content"]);
    const finishReason = readPath(payload, ["choices", 0, "finish_reason"]);

    if (typeof content !== "string") {
      throw new Error("LLM response did not include message content.");
    }

    return {
      text: content,
      finishReason: typeof finishReason === "string" ? finishReason : null,
      raw: payload,
      usage: extractOpenAiUsage(payload),
    };
  }

  getProvider(): LLMProvider {
    return this.provider;
  }

  getModel(): string | undefined {
    return this.model;
  }
}

function extractOpenAiUsage(payload: unknown): LLMUsage | undefined {
  const promptTokens = readNumber(readPath(payload, ["usage", "prompt_tokens"]));
  const completionTokens = readNumber(readPath(payload, ["usage", "completion_tokens"]));
  const totalTokens = readNumber(readPath(payload, ["usage", "total_tokens"]));

  if (promptTokens === undefined && completionTokens === undefined && totalTokens === undefined) {
    return undefined;
  }

  const usage: LLMUsage = {};
  if (promptTokens !== undefined) usage.promptTokens = promptTokens;
  if (completionTokens !== undefined) usage.completionTokens = completionTokens;
  if (totalTokens !== undefined) usage.totalTokens = totalTokens;
  return usage;
}
