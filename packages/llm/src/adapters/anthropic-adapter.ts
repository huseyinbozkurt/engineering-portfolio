import type {
  LLMAdapter,
  LLMGenerateParams,
  LLMGenerateResult,
  LLMProvider,
  LLMUsage,
} from "./types";
import { joinUrl, readNumber, readPath, timedFetch } from "./http";

export interface AnthropicAdapterConfig {
  baseUrl?: string;
  apiKey: string;
  model: string;
  timeoutMs?: number;
  maxTokens?: number;
  temperature?: number;
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
  private readonly maxTokens: number;
  private readonly temperature: number;
  private readonly apiVersion: string;

  constructor(config: AnthropicAdapterConfig) {
    this.baseUrl = config.baseUrl ?? "https://api.anthropic.com/v1";
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.timeoutMs = 900000;
    this.maxTokens = config.maxTokens ?? 12000;
    this.temperature = config.temperature ?? 0.2;
    this.apiVersion = config.apiVersion ?? "2023-06-01";
  }

  async generate(params: LLMGenerateParams): Promise<LLMGenerateResult> {
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
          max_tokens: this.maxTokens,
          temperature: this.temperature,
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
