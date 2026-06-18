/**
 * AI-insight caching: identity, lookup, and validation.
 *
 * The cache is a *view over successful `llm_runs`* keyed by a composite identity
 * (dataset + prompt + model + output-affecting config). A new generation whose
 * identity matches a prior successful run can reuse that run's output instead of
 * calling the LLM. This module owns the identity computation and the "is a valid
 * cache hit available?" decision; it never calls the LLM and adds no new table.
 *
 * Consumed by:
 *   - the unified task runner (cache-hit short-circuit on generate), and
 *   - the admin cache-status action (pre-generate confirmation modal).
 */

import { createHash } from "node:crypto";

import { getActiveLlmConfiguration } from "@portfolio/db/llm-configurations";
import { getActivePromptVersion } from "@portfolio/db/llm-prompt-versions";
import {
  getLatestSuccessfulInsightRunByIdentity,
  type InsightCacheIdentity,
  type LlmRunRecord,
} from "@portfolio/db/llm-runs";
import { getPublishedInsightSource } from "@portfolio/db/queries";
import {
  portfolioInsightOutputSchema,
  type PortfolioInsightInput,
  type PortfolioInsightOutput,
} from "@portfolio/validators";

import { resolveOnlineLlmAdapter } from "../adapters/online";
import { resolveWorkflowConfig, type ResolvedWorkflowConfig } from "../management/config-resolution";
import { buildPortfolioInsightInput, isInsightInputEmpty } from "../insights/input";
import { computeDatasetHash, stableStringify } from "../insights/dataset-hash";
import { homePageContentRuleViolation } from "../insights/validate";

export type { InsightCacheIdentity } from "@portfolio/db/llm-runs";

const AI_INSIGHTS_WORKFLOW = "aiInsights" as const;

/**
 * SHA-256 of the output-affecting resolved config. Excludes operational fields
 * (maxRetries/timeoutMs/baseUrl/visibleModelName) that do not change the model's
 * output. `model` is NOT included here — it is a separate identity field — but
 * `provider` is, since the same model name on a different provider can differ.
 */
export function computeConfigHash(config: ResolvedWorkflowConfig): string {
  const outputAffecting = {
    provider: config.provider,
    temperature: config.temperature,
    topP: config.topP,
    maxTokens: config.maxTokens,
    schemaMode: "json",
    generation: config.generation,
  };
  return createHash("sha256").update(stableStringify(outputAffecting)).digest("hex");
}

export interface BuildInsightIdentityParams {
  input: PortfolioInsightInput;
  config: ResolvedWorkflowConfig;
  /** Effective model: the DB config model, else the resolved adapter's model. */
  effectiveModel: string | null;
  promptVersionId: string | null;
  /** Active DB prompt version. */
  promptVersion: string;
}

export interface BuiltInsightIdentity {
  datasetHash: string;
  configHash: string;
  identity: InsightCacheIdentity;
}

/** Assemble the composite cache identity from already-resolved pieces (pure). */
export function buildInsightIdentity(params: BuildInsightIdentityParams): BuiltInsightIdentity {
  const datasetHash = computeDatasetHash(params.input);
  const configHash = computeConfigHash(params.config);
  return {
    datasetHash,
    configHash,
    identity: {
      workflow: AI_INSIGHTS_WORKFLOW,
      datasetHash,
      configHash,
      model: params.effectiveModel,
      promptVersionId: params.promptVersionId,
      promptVersion: params.promptVersion,
    },
  };
}

/**
 * Re-validate a stored run output before it can be served from cache (§ cached-
 * run validation): it must parse against the current schema AND satisfy the
 * current homepage rules. A run whose output no longer validates (schema drift,
 * missing homePageContent) is treated as no cache, forcing regeneration. The
 * run's status was already constrained to a successful one by the DB lookup.
 */
export function parseUsableInsightOutput(outputJson: unknown): PortfolioInsightOutput | null {
  if (outputJson === null || outputJson === undefined) {
    return null;
  }
  const parsed = portfolioInsightOutputSchema.safeParse(outputJson);
  if (!parsed.success) {
    return null;
  }
  if (homePageContentRuleViolation(parsed.data)) {
    return null;
  }
  return parsed.data;
}

export interface ValidCachedInsight {
  run: LlmRunRecord;
  output: PortfolioInsightOutput;
}

/**
 * The latest successful run matching `identity` whose stored output still
 * validates, or null. The lookup is injectable so the decision can be unit
 * tested without a database.
 */
export async function findValidCachedInsightRun(
  identity: InsightCacheIdentity,
  lookup: (
    id: InsightCacheIdentity,
  ) => Promise<LlmRunRecord | null> = getLatestSuccessfulInsightRunByIdentity,
): Promise<ValidCachedInsight | null> {
  const run = await lookup(identity);
  if (!run) {
    return null;
  }
  const output = parseUsableInsightOutput(run.outputJson);
  if (!output) {
    return null;
  }
  return { run, output };
}

export interface InsightCacheStatus {
  cacheHit: boolean;
  datasetHash: string;
  cachedRunId?: string;
  /** ISO timestamp of when the cached run completed (or was created). */
  cachedGeneratedAt?: string;
  cachedPromptVersion?: string;
  cachedModel?: string;
}

/**
 * Resolve the current insight cache identity and report whether a valid cache
 * hit exists — WITHOUT calling the LLM. Backs the admin "already up to date"
 * confirmation modal. The adapter is resolved only when the active config does
 * not pin a model (.env fallback), to get the effective model for the identity.
 */
export async function getInsightCacheStatus(): Promise<InsightCacheStatus> {
  const [activeVersion, activeConfig, source] = await Promise.all([
    getActivePromptVersion(AI_INSIGHTS_WORKFLOW),
    getActiveLlmConfiguration(AI_INSIGHTS_WORKFLOW),
    getPublishedInsightSource(),
  ]);

  const input = buildPortfolioInsightInput(source);
  if (!activeVersion || !activeConfig) {
    return { cacheHit: false, datasetHash: computeDatasetHash(input) };
  }
  const config = resolveWorkflowConfig(activeConfig);

  let effectiveModel = config.model;
  if (effectiveModel === null) {
    const adapter = await resolveOnlineLlmAdapter();
    effectiveModel = adapter?.adapter.getModel() ?? null;
  }

  const { datasetHash, identity } = buildInsightIdentity({
    input,
    config,
    effectiveModel,
    promptVersionId: activeVersion.id,
    promptVersion: activeVersion.version,
  });

  // Nothing to analyze — no cache, and a real generation would fail-closed too.
  if (isInsightInputEmpty(input)) {
    return { cacheHit: false, datasetHash };
  }

  const cached = await findValidCachedInsightRun(identity);
  if (!cached) {
    return { cacheHit: false, datasetHash };
  }

  const status: InsightCacheStatus = {
    cacheHit: true,
    datasetHash,
    cachedRunId: cached.run.id,
    cachedGeneratedAt: (cached.run.completedAt ?? cached.run.createdAt).toISOString(),
  };
  if (cached.run.promptVersion) {
    status.cachedPromptVersion = cached.run.promptVersion;
  }
  const cachedModel = cached.run.visibleModelName ?? cached.run.model;
  if (cachedModel) {
    status.cachedModel = cachedModel;
  }
  return status;
}
