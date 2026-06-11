import type { LLMAdapter, LLMGenerateParams, LLMGenerateResult, LLMProvider } from "./types";
import { OpenAiCompatibleAdapter } from "./openai-compatible-adapter";
import { joinUrl } from "./http";

export interface LocalQwenAdapterConfig {
  model?: string;
  baseUrl?: string;
}

/**
 * Convenience adapter for a local Qwen (or similar) OpenAI-compatible server,
 * configured via `LOCAL_LLM_BASE_URL` / `LOCAL_LLM_MODEL` / `LOCAL_LLM_API_KEY`
 * / `LOCAL_LLM_TIMEOUT_MS`. Thin wrapper over {@link OpenAiCompatibleAdapter}.
 */
export class LocalQwenAdapter implements LLMAdapter {
  private readonly inner: OpenAiCompatibleAdapter;

  constructor(config: LocalQwenAdapterConfig = {}) {
    const baseUrl = config.baseUrl ?? process.env.LOCAL_LLM_BASE_URL;

    if (!baseUrl) {
      throw new Error(
        "LOCAL_LLM_BASE_URL is required for LocalQwenAdapter. Set it in environment variables.",
      );
    }

    const timeoutMs = Number(process.env.LOCAL_LLM_TIMEOUT_MS);

    this.inner = new OpenAiCompatibleAdapter({
      provider: "custom",
      // Local servers expose the API under /v1.
      baseUrl: joinUrl(baseUrl, "v1"),
      apiKey: process.env.LOCAL_LLM_API_KEY ?? null,
      model: config.model ?? process.env.LOCAL_LLM_MODEL ?? "qwen-coder-next-q4",
      // 15-minute floor: local models routinely need long generation windows.
      timeoutMs: Math.max(Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 900000, 900000),
      jsonResponseFormat: true,
    });
  }

  generate(params: LLMGenerateParams): Promise<LLMGenerateResult> {
    return this.inner.generate(params);
  }

  getProvider(): LLMProvider {
    return "custom";
  }

  getModel(): string | undefined {
    return this.inner.getModel();
  }
}
