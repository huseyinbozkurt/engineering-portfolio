import {
  AnthropicAdapter,
  OpenAiCompatibleAdapter,
  type LLMAdapter,
} from "@portfolio/llm";

import {
  getLlmConnectionConfigs,
  getLlmConnectionStatuses,
  type LlmConnectionConfig,
} from "@/lib/llm-config";

/**
 * Maps the first online LLM connection (per the env-driven discovery in
 * `lib/llm-config`) onto a provider adapter from @portfolio/llm. Shared by
 * every LLM feature in the admin (AI insights, AI stories, …) — each feature
 * builds its own prompts; only the transport is shared. Supports OpenAI /
 * DeepSeek / Anthropic and any OpenAI-compatible custom endpoint (Ollama, MLX
 * servers, LM Studio, …).
 */
export interface ResolvedLlmAdapter {
  adapter: LLMAdapter;
  connection: LlmConnectionConfig;
}

const defaultTimeoutMs = 900000;
const defaultMaxTokens = 12000;

export async function resolveOnlineLlmAdapter(): Promise<ResolvedLlmAdapter | null> {
  const [statuses, configs] = await Promise.all([
    getLlmConnectionStatuses(),
    Promise.resolve(getLlmConnectionConfigs()),
  ]);

  const online = statuses.find((status) => status.status === "online");
  if (!online) {
    return null;
  }

  const connection = configs.find((candidate) => candidate.id === online.id);
  if (!connection?.model) {
    return null;
  }

  const timeoutMs = positiveNumber(process.env.LLM_ANALYSIS_TIMEOUT_MS) ?? defaultTimeoutMs;
  const maxTokens = positiveNumber(process.env.LLM_ANALYSIS_MAX_TOKENS) ?? defaultMaxTokens;

  if (connection.provider === "anthropic") {
    if (!connection.apiKey) {
      return null;
    }
    return {
      connection,
      adapter: new AnthropicAdapter({
        baseUrl: connection.baseUrl,
        apiKey: connection.apiKey,
        model: connection.model,
        timeoutMs,
        maxTokens,
      }),
    };
  }

  return {
    connection,
    adapter: new OpenAiCompatibleAdapter({
      provider: connection.provider === "openai" || connection.provider === "deepseek"
        ? connection.provider
        : "custom",
      baseUrl: connection.baseUrl,
      apiKey: connection.apiKey,
      model: connection.model,
      timeoutMs,
      maxTokens,
      // Local/custom servers sometimes reject response_format; hosted ones use it.
      jsonResponseFormat: connection.provider !== "custom",
    }),
  };
}

function positiveNumber(value: string | undefined): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
