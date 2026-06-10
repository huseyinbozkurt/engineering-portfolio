/**
 * LLM adapter contract. Every provider (OpenAI-compatible, Anthropic, local
 * endpoints, mock) implements this interface so the insight runner stays
 * provider-agnostic and future providers plug in without pipeline changes.
 */

export type LLMProvider = "openai" | "anthropic" | "deepseek" | "custom" | "mock";

export interface LLMUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface LLMGenerateParams {
  systemPrompt?: string;
  userPrompt: string;
  /** Hint that strict JSON output is expected (providers map it as supported). */
  schema?: unknown;
  metadata?: Record<string, unknown>;
}

export interface LLMGenerateResult {
  text: string;
  finishReason?: string | null | undefined;
  raw?: unknown;
  usage?: LLMUsage | undefined;
  estimatedCostUsd?: string | number | undefined;
}

export interface LLMAdapter {
  generate(params: LLMGenerateParams): Promise<LLMGenerateResult>;
  getProvider(): LLMProvider;
  getModel(): string | undefined;
}

export interface LLMAdapterConfig {
  provider: LLMProvider;
  model?: string;
}
