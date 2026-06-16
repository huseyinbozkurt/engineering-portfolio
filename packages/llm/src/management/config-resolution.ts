import type { LLMGenerationSettings } from "../adapters/types";
import { STRUCTURED_JSON_GENERATION } from "../adapters/generation";

/**
 * Minimal shape of an active DB configuration the resolver needs. Kept narrow so
 * this module stays dependency-pure and unit-testable.
 */
export interface ActiveConfigLike {
  id: string;
  provider: string;
  model: string;
  visibleModelName: string | null;
  baseUrl: string | null;
  temperature: number;
  topP: number;
  /** 0 means "unlimited" — no explicit completion cap is sent. */
  maxTokens: number;
  maxRetries: number;
  timeoutMs: number | null;
}

export interface ResolvedWorkflowConfig {
  /** Where the config came from — persisted on the run for provenance. */
  source: "db" | "envFallback";
  configurationId: string | null;
  provider: string | null;
  model: string | null;
  visibleModelName: string | null;
  baseUrl: string | null;
  temperature: number | null;
  topP: number | null;
  maxTokens: number | null;
  maxRetries: number;
  timeoutMs: number | null;
  /** Per-call generation settings to pass to the adapter (undefined fields → adapter defaults). */
  generation: LLMGenerationSettings;
}

/** Default retry count when falling back to .env config. */
const DEFAULT_ENV_MAX_RETRIES = 2;

/**
 * Resolve generation settings + provenance for a workflow run:
 *   1. An active DB configuration supplies provider/model/sampling/retry values.
 *   2. Otherwise the structured-JSON profile is used and the caller builds the
 *      adapter from .env (provider/model are filled in by the .env adapter).
 *
 * Pure: the active config is injected. `maxTokens: 0` (unlimited) maps to an
 * undefined per-call cap so the adapter's own default applies rather than
 * sending `0` to a provider.
 */
export function resolveWorkflowConfig(
  activeConfig: ActiveConfigLike | null,
): ResolvedWorkflowConfig {
  if (activeConfig) {
    const maxTokens = activeConfig.maxTokens > 0 ? activeConfig.maxTokens : null;
    const generation: LLMGenerationSettings = {
      temperature: activeConfig.temperature,
      topP: activeConfig.topP,
      ...(maxTokens !== null ? { maxTokens } : {}),
    };
    return {
      source: "db",
      configurationId: activeConfig.id,
      provider: activeConfig.provider,
      model: activeConfig.model,
      visibleModelName: activeConfig.visibleModelName,
      baseUrl: activeConfig.baseUrl,
      temperature: activeConfig.temperature,
      topP: activeConfig.topP,
      maxTokens,
      maxRetries: activeConfig.maxRetries,
      timeoutMs: activeConfig.timeoutMs,
      generation,
    };
  }

  return {
    source: "envFallback",
    configurationId: null,
    provider: null,
    model: null,
    visibleModelName: null,
    baseUrl: null,
    temperature: STRUCTURED_JSON_GENERATION.temperature,
    topP: STRUCTURED_JSON_GENERATION.topP,
    maxTokens: STRUCTURED_JSON_GENERATION.maxTokens,
    maxRetries: DEFAULT_ENV_MAX_RETRIES,
    timeoutMs: null,
    generation: { ...STRUCTURED_JSON_GENERATION },
  };
}
