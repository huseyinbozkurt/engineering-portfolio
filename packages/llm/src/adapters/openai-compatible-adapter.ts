import type {
  LLMAdapter,
  LLMGenerateParams,
  LLMGenerateResult,
  LLMProvider,
  LLMUsage,
} from "./types";
import { joinUrl, readNumber, readPath, timedFetch } from "./http";

export interface OpenAiCompatibleAdapterConfig {
  /** Provider label recorded on runs; "custom" covers Ollama / MLX / LM Studio. */
  provider?: Extract<LLMProvider, "openai" | "deepseek" | "custom">;
  baseUrl: string;
  apiKey?: string | null;
  model: string;
  timeoutMs?: number;
  maxTokens?: number;
  temperature?: number;
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
  private readonly maxTokens: number;
  private readonly temperature: number;
  private readonly jsonResponseFormat: boolean;

  constructor(config: OpenAiCompatibleAdapterConfig) {
    this.provider = config.provider ?? "custom";
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey ?? null;
    this.model = config.model;
    this.timeoutMs = 900000;
    this.maxTokens = config.maxTokens ?? 12000;
    this.temperature = config.temperature ?? 0.2;
    this.jsonResponseFormat = config.jsonResponseFormat ?? this.provider !== "custom";
  }

  async generate(params: LLMGenerateParams): Promise<LLMGenerateResult> {
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
          temperature: this.temperature,
          max_tokens: this.maxTokens,
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
