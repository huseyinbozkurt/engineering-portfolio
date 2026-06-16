import type { LLMGenerationSettings } from "./types";

/**
 * Generation profile for the portfolio's structured-JSON analysis workflows
 * (AI insights, homepage insight content, taxonomy/relation review, content
 * review). These tasks must return deterministic, schema-valid JSON, so they
 * run cool with nucleus sampling and a completion budget large enough to hold a
 * full report.
 *
 * - `temperature: 0.2` — low variance keeps the structure stable across runs.
 * - `topP: 0.9` — trims the long tail without collapsing to pure greedy decode.
 * - `maxTokens: 32000` — a full insight report is large; truncation shows up as
 *   a JSON parse failure, so the ceiling sits comfortably above 30k.
 *
 * Hosted providers cap completion length below this (e.g. OpenAI gpt-4o-mini at
 * 16k, Claude 3.5 Sonnet at 8k). Point those at a smaller budget with
 * `LLM_ANALYSIS_MAX_TOKENS`; the local models this portfolio targets
 * (gemma4:31b and friends) have the headroom for the full default.
 */
export const STRUCTURED_JSON_GENERATION: Required<LLMGenerationSettings> = {
  temperature: 0.2,
  topP: 0.9,
  maxTokens: 32000,
};

/**
 * Resolve the effective generation settings for one call: per-call overrides
 * win field-by-field over the adapter's configured defaults. An unset per-call
 * field never clobbers a configured default with `undefined`.
 */
export function resolveGeneration(
  perCall: LLMGenerationSettings | undefined,
  defaults: Required<LLMGenerationSettings>,
): Required<LLMGenerationSettings> {
  return {
    temperature: perCall?.temperature ?? defaults.temperature,
    topP: perCall?.topP ?? defaults.topP,
    maxTokens: perCall?.maxTokens ?? defaults.maxTokens,
  };
}
