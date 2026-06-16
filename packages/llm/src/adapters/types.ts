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

/**
 * Sampling/length controls for a single generation. Every field is optional;
 * an unset field falls back to the adapter's configured default (which is
 * itself the structured-JSON profile unless the resolver overrode it from env).
 * See {@link STRUCTURED_JSON_GENERATION} for the defaults these workflows use.
 */
export interface LLMGenerationSettings {
  /** 0 = greedy/deterministic. Structured analysis uses a low value (0.2). */
  temperature?: number;
  /** Nucleus sampling cutoff (0–1). Structured analysis uses 0.9. */
  topP?: number;
  /** Completion-token ceiling. Structured analysis needs > 30k for full JSON. */
  maxTokens?: number;
}

export interface LLMGenerateParams {
  systemPrompt?: string;
  userPrompt: string;
  /** Hint that strict JSON output is expected (providers map it as supported). */
  schema?: unknown;
  /**
   * Per-call sampling/length overrides. Unset fields fall back to the adapter's
   * construction-time defaults, so callers only specify what they want to change.
   */
  generation?: LLMGenerationSettings;
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
