export const AI_MODEL_DISPLAY_NAMES: Record<string, string> = {
  "openai:gpt-4.1": "GPT-4.1",
  "openai:gpt-4o": "GPT-4o",
  "openai:gpt-4o-mini": "GPT-4o mini",
  "anthropic:claude-sonnet-4": "Claude Sonnet 4",
  "anthropic:claude-3-5-sonnet-latest": "Claude 3.5 Sonnet",
  "deepseek:deepseek-chat": "DeepSeek Chat",
  "local:qwen3-coder-next": "Qwen3 Coder (Local)",
  "custom:qwen3-coder-next": "Qwen3 Coder (Local)",
  "custom:qwen-coder-next-q4": "Qwen Coder (Local)",
  "custom:gemma": "Gemma 4 30B (Local)", 
  "mock:mock-pipeline-check": "Mock Pipeline Check",
};

export function getAiModelDisplayName(input: {
  provider?: string | null | undefined;
  model?: string | null | undefined;
}): string {
  const key = `${input.provider ?? "unknown"}:${input.model ?? "unknown"}`;

  return AI_MODEL_DISPLAY_NAMES[key] ?? input.model ?? input.provider ?? "AI model";
}

/**
 * The single name to surface in UI for an LLM run/config. Precedence:
 *   1. an admin-set `visibleModelName` (a curated label — never the raw id),
 *   2. a known friendly mapping or the raw model id,
 *   3. the provider,
 *   4. "AI model".
 *
 * When `visibleModelName` is set the raw model id is never exposed — callers
 * should pass it through this helper rather than reading `model` directly.
 */
export function resolveVisibleModelName(input: {
  visibleModelName?: string | null;
  provider?: string | null;
  model?: string | null;
}): string {
  const visible = input.visibleModelName?.trim();
  if (visible) {
    return visible;
  }
  return getAiModelDisplayName({ provider: input.provider, model: input.model });
}
