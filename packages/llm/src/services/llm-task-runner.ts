/**
 * Unified LLM Task Runner Service
 *
 * The single execution boundary for every LLM workflow. The Admin app triggers
 * a task with business context only (`runLlmTask`); this service owns:
 *   - active prompt-version + configuration resolution from the DB
 *   - DB-managed prompt and configuration resolution
 *   - prompt rendering and required-variable validation
 *   - LLM execution with retries and output validation (via the workflow runners)
 *   - unified `llm_runs` persistence (creation + status transitions) with the
 *     full prompt/config provenance needed to audit a run
 *
 * Admin code MUST NOT read prompt versions or LLM configurations directly for
 * execution — it calls `runLlmTask` and nothing else.
 */

import { getActiveLlmConfiguration } from "@portfolio/db/llm-configurations";
import { getActivePromptVersion } from "@portfolio/db/llm-prompt-versions";
import {
  completeLlmRunWithSuggestions,
  createLlmRun,
  getActiveLlmRun,
  updateLlmRun,
  type CreateLlmRunSuggestionInput,
} from "@portfolio/db/llm-runs";
import {
  LLM_WORKFLOWS,
  validateTemplateForWorkflow,
  type LlmWorkflow,
  type PortfolioInsightInput,
  type TaxonomyReviewInput,
  type TaxonomySuggestion,
} from "@portfolio/validators";

import { resolveConfiguredLlmAdapter, type ResolvedLlmAdapter } from "../adapters/online";
import {
  resolveWorkflowConfig,
  type ResolvedWorkflowConfig,
} from "../management/config-resolution";
import {
  resolveWorkflowPrompt,
  type ResolvedWorkflowPrompt,
} from "../management/prompt-resolution";
import { buildPortfolioInsightInput, isInsightInputEmpty } from "../insights/input";
import { getInsightResponseShape } from "../insights/prompt";
import { runPortfolioInsight, type InsightRunStore } from "../insights/runner";
import {
  buildInsightIdentity,
  findValidCachedInsightRun,
  type InsightCacheIdentity,
  type ValidCachedInsight,
} from "./insight-cache";
import { buildTaxonomyReviewInput, isTaxonomyReviewInputEmpty } from "../taxonomy-review/input";
import { getTaxonomyReviewResponseShape } from "../taxonomy-review/prompt";
import { runTaxonomyReview, type TaxonomyReviewRunStore } from "../taxonomy-review/runner";
import { getPublishedInsightSource } from "@portfolio/db/queries";
import { getTaxonomyReviewSource } from "@portfolio/db/taxonomy-review";
import { triggerContentReviewTask } from "../task-runner";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RunLlmTaskInput {
  /** Which LLM workflow to run (maps to a DB prompt key + configuration). */
  workflow: LlmWorkflow;
  /**
   * Pre-built business context for the workflow. `aiInsights` expects a
   * `PortfolioInsightInput`; `taxonomyReview` expects a `TaxonomyReviewInput`.
   * The caller gathers business data only — never prompts or model config.
   */
  /** Optional entity the run is about; persisted as targetType/targetId. */
  entityType?: string | null;
  entityId?: string | null;
  /**
   * Who triggered the run. Reserved for the audit trail once the admin has an
   * authenticated user id and a `requested_by` column exists; not persisted yet.
   */
  requestedBy?: string | null;
  /**
   * Bypass the AI-insight cache and force a fresh LLM generation even when the
   * cache identity is unchanged (prompt experimentation, model comparison,
   * regeneration). The fresh successful run becomes the new cache entry. Only
   * the aiInsights workflow is cached; ignored elsewhere.
   */
  forceRefresh?: boolean;
}

export interface RunLlmTaskOptions {
  /** Inject a pre-resolved adapter (tests, or callers that already resolved one). */
  resolvedAdapter?: ResolvedLlmAdapter | null;
}

export interface RunLlmTaskResult {
  /** The created (or already-active) run id, or "" when the task did not start. */
  runId: string;
  status: "created" | "alreadyRunning" | "error";
  message?: string;
  error?: string;
  /** True when the run reused a cached output instead of calling the LLM. */
  cacheHit?: boolean;
  /** The prior run whose output was reused (cache hit only). */
  cachedRunId?: string;
}

/** Thrown during resolution when the input or a prompt template is invalid. */
export class LlmValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmValidationError";
  }
}

/** Everything resolved up front and carried into the background execution step. */
interface ResolvedTaskData {
  workflow: LlmWorkflow;
  prompt: ResolvedWorkflowPrompt;
  config: ResolvedWorkflowConfig;
  adapter: ResolvedLlmAdapter;
  input: unknown;
  entityType: string | null;
  entityId: string | null;
  /** AI-insight cache identity (aiInsights only; undefined for other workflows). */
  datasetHash?: string;
  configHash?: string;
  identity?: InsightCacheIdentity;
  /** Set when this run is created as a cache-hit audit row (no LLM call). */
  cacheHit?: boolean;
}


const LlmTaskInputGenerators = {
  aiInsights: async () => {
     const publishedInsightSource = await getPublishedInsightSource();
    return buildPortfolioInsightInput(publishedInsightSource);},
  taxonomyReview: async () => {
    const publishedTaxonomySource = await getTaxonomyReviewSource();
    return buildTaxonomyReviewInput(publishedTaxonomySource);
  },
  contentReview: async () => { return {}; },
  relationReview: async () => { return {};},
}

// ---------------------------------------------------------------------------
// runLlmTask — the single entry point
// ---------------------------------------------------------------------------

export async function runLlmTask(
  params: RunLlmTaskInput,
  options: RunLlmTaskOptions = {},
): Promise<RunLlmTaskResult> {
  const { workflow } = params;

  if (!LLM_WORKFLOWS.includes(workflow)) {
    return {
      runId: "",
      status: "error",
      error: `Unknown workflow "${workflow}". Available: ${LLM_WORKFLOWS.join(", ")}.`,
    };
  }

  if (workflow === "contentReview") {
    const contentType = params.entityType;
    if (
      !params.entityId ||
      (contentType !== "experience" && contentType !== "project" && contentType !== "case_study")
    ) {
      return {
        runId: "",
        status: "error",
        error: "Content review requires an experience, project, or case_study entity.",
      };
    }
    const result = await triggerContentReviewTask(contentType, params.entityId);
    return {
      runId: result.taskId,
      status: result.status,
      ...(result.error ? { error: result.error } : {}),
    };
  }

  // One in-flight run per workflow at a time.
  const existing = await getActiveLlmRun(workflow);
  if (existing) {
    return {
      runId: existing.id,
      status: "alreadyRunning",
      message: `A ${workflow} run is already in progress.`,
    };
  }

  const activeConfig = await getActiveLlmConfiguration(workflow);
  if (!activeConfig) {
    return {
      runId: "",
      status: "error",
      error: `No active DB configuration exists for the ${workflow} workflow.`,
    };
  }

  const adapter = options.resolvedAdapter ?? resolveConfiguredLlmAdapter(activeConfig);
  if (!adapter) {
    return {
      runId: "",
      status: "error",
      error: "No online LLM connection is available. Configure a provider before running.",
    };
  }

  let resolved: ResolvedTaskData;
  try {
    resolved = await resolveTaskData(workflow, params, adapter, activeConfig);
  } catch (error) {
    return {
      runId: "",
      status: "error",
      error: error instanceof Error ? error.message : "Failed to resolve prompt/config.",
    };
  }

  // AI-insight cache: when the full identity (dataset + prompt + model + config)
  // is unchanged since a prior successful run, reuse that output instead of
  // calling the LLM. `forceRefresh` bypasses this. A cache hit still writes an
  // audit row (cacheHit = true) so run history stays complete.
  if (workflow === "aiInsights" && !params.forceRefresh && resolved.identity) {
    const cached = await findValidCachedInsightRun(resolved.identity);
    if (cached) {
      try {
        const runId = await createCacheHitRunRecord(resolved, cached);
        return {
          runId,
          status: "created",
          cacheHit: true,
          cachedRunId: cached.run.id,
          message: "Served from cache — dataset, prompt, and config unchanged. No LLM call made.",
        };
      } catch (error) {
        return {
          runId: "",
          status: "error",
          error: `Could not record the cached insight run.${
            error instanceof Error ? ` (${error.message})` : ""
          }`,
        };
      }
    }
  }

  let runId: string;
  try {
    runId = await createRunRecord(resolved);
  } catch (error) {
    return {
      runId: "",
      status: "error",
      error: `Could not create the run record. Apply the database migration and try again.${
        error instanceof Error ? ` (${error.message})` : ""
      }`,
    };
  }

  // Fire-and-forget: the caller returns immediately while the runs table
  // refreshes. The runner persists every terminal transition on the same run.
  setTimeout(() => {
    void executeTask(runId, resolved);
  }, 0);

  return {
    runId,
    status: "created",
    message: `LLM task "${workflow}" started.`,
  };
}

// ---------------------------------------------------------------------------
// Resolution: active DB prompt/config → rendered prompt
// ---------------------------------------------------------------------------

async function resolveTaskData(
  workflow: LlmWorkflow,
  params: RunLlmTaskInput,
  adapter: ResolvedLlmAdapter,
  activeConfig: NonNullable<Awaited<ReturnType<typeof getActiveLlmConfiguration>>>,
): Promise<ResolvedTaskData> {
  const activeVersion = await getActivePromptVersion(workflow);

  if (!activeVersion) {
    throw new LlmValidationError(
      `No active DB prompt is configured for the ${workflow} workflow. Create and activate one in LLM Settings → Prompts.`,
    );
  }

  const input = await LlmTaskInputGenerators[workflow]();
  const config = resolveWorkflowConfig(activeConfig);
  const variables = buildVariablesForWorkflow(workflow, input);

  // Defense in depth: a DB template must obey the workflow's variable contract.
  // The admin save flow already enforces this, but a runtime check fails closed
  // rather than rendering a malformed prompt and sending it to the model.
  validateTemplateVariables(activeVersion.userPromptTemplate, workflow);

  const prompt = resolveWorkflowPrompt({
    workflow,
    activeVersion,
    variables,
  });

  const resolved: ResolvedTaskData = {
    workflow,
    prompt,
    config,
    adapter,
    input,
    entityType: params.entityType ?? null,
    entityId: params.entityId ?? null,
  };

  // AI insights participate in identity caching. Compute the identity from the
  // SAME resolution used to create the run so a future cache lookup and the
  // stored run agree on dataset/prompt/model/config.
  if (workflow === "aiInsights") {
    const effectiveModel = config.model ?? adapter.adapter.getModel() ?? null;
    const built = buildInsightIdentity({
      input: input as PortfolioInsightInput,
      config,
      effectiveModel,
      promptVersionId: prompt.promptVersionId,
      promptVersion: activeVersion.version,
    });
    resolved.datasetHash = built.datasetHash;
    resolved.configHash = built.configHash;
    resolved.identity = built.identity;
  }

  return resolved;
}

/**
 * Build the template variables for a workflow from its already-built business
 * input. `responseShape` mirrors the code prompt's contract so a DB template
 * renders the same schema; `dataset` is the serialized input. Throws when there
 * is nothing to analyze.
 */
export function buildVariablesForWorkflow(
  workflow: LlmWorkflow,
  input: PortfolioInsightInput | TaxonomyReviewInput | {},
): Record<string, string> {
  switch (workflow) {
    case "aiInsights": {
      const insightInput = input as PortfolioInsightInput;
      if (!insightInput || isInsightInputEmpty(insightInput)) {
        throw new LlmValidationError("No portfolio data available for insight generation.");
      }
      return {
        responseShape: getInsightResponseShape(),
        dataset: JSON.stringify(insightInput),
      };
    }
    case "taxonomyReview": {
      const taxonomyInput = input as TaxonomyReviewInput;
      if (!taxonomyInput || isTaxonomyReviewInputEmpty(taxonomyInput)) {
        throw new LlmValidationError("No portfolio data available for taxonomy review.");
      }
      return {
        responseShape: getTaxonomyReviewResponseShape(),
        dataset: JSON.stringify(taxonomyInput),
      };
    }
    default:
      throw new LlmValidationError(`Workflow "${workflow}" is not wired for execution yet.`);
  }
}

/**
 * Validate a DB prompt template against the workflow's variable contract:
 * every required variable must appear and no unknown variable may be used.
 */
export function validateTemplateVariables(
  userPromptTemplate: string,
  workflow: LlmWorkflow,
): void {
  const result = validateTemplateForWorkflow(workflow, userPromptTemplate);
  if (result.ok) {
    return;
  }

  const problems: string[] = [];
  if (result.missingRequired.length > 0) {
    problems.push(
      `missing required ${result.missingRequired.map((name) => `{{${name}}}`).join(", ")}`,
    );
  }
  if (result.unknown.length > 0) {
    problems.push(`unknown ${result.unknown.map((name) => `{{${name}}}`).join(", ")}`);
  }

  throw new LlmValidationError(`Invalid ${workflow} prompt template — ${problems.join("; ")}.`);
}

// ---------------------------------------------------------------------------
// Run record creation (full provenance persisted at start)
// ---------------------------------------------------------------------------

async function createRunRecord(data: ResolvedTaskData): Promise<string> {
  const { prompt, config, adapter } = data;

  const run = await createLlmRun({
    workflow: data.workflow,
    targetType: data.entityType,
    targetId: data.entityId,
    status: "running",
    provider: config.provider ?? adapter.adapter.getProvider(),
    model: config.model ?? adapter.adapter.getModel() ?? null,
    visibleModelName: config.visibleModelName,
    promptSource: prompt.source,
    promptVersionId: prompt.promptVersionId,
    promptVersion: prompt.promptVersion,
    promptName: prompt.promptName,
    configSource: config.source,
    llmConfigurationId: config.configurationId,
    temperature: config.temperature,
    topP: config.topP,
    maxTokens: config.maxTokens,
    maxRetries: config.maxRetries,
    timeoutMs: config.timeoutMs,
    promptSystem: prompt.system,
    promptUser: prompt.user,
    inputSnapshot: data.input,
    datasetHash: data.datasetHash ?? null,
    configHash: data.configHash ?? null,
    cacheHit: data.cacheHit ?? false,
    startedAt: new Date(),
  });

  return run.id;
}

/**
 * Persist a cache-hit audit row: a terminal succeeded run that reused a prior
 * successful output WITHOUT calling the LLM. Created with full prompt/config
 * provenance and `cacheHit = true`, then immediately completed with the cached
 * output. Token usage is null — no tokens were spent.
 */
async function createCacheHitRunRecord(
  data: ResolvedTaskData,
  cached: ValidCachedInsight,
): Promise<string> {
  const runId = await createRunRecord({ ...data, cacheHit: true });
  const completedAt = new Date();
  await updateLlmRun(
    runId,
    {
      status: "succeeded",
      rawResponse: null,
      outputJson: cached.output,
      validationNotes: [
        `Served from cache — dataset, prompt, and config unchanged since run ${cached.run.id}.`,
      ],
      tokenUsage: null,
      attempts: [],
      errorStage: null,
      errorMessage: null,
      completedAt,
      durationMs: 0,
    },
    { onlyIfActive: true },
  );
  return runId;
}

// ---------------------------------------------------------------------------
// Background execution (per-workflow dispatch)
// ---------------------------------------------------------------------------

async function executeTask(runId: string, data: ResolvedTaskData): Promise<void> {
  const startedAt = new Date();
  try {
    switch (data.workflow) {
      case "aiInsights":
        await executeInsightTask(runId, data, startedAt);
        break;
      case "taxonomyReview":
        await executeTaxonomyReviewTask(runId, data, startedAt);
        break;
      default:
        await failRun(runId, "workflow", `No executor for workflow "${data.workflow}".`, startedAt);
    }
  } catch (error) {
    await failRun(
      runId,
      "runner",
      error instanceof Error ? error.message : "Unexpected runner failure.",
      startedAt,
    );
  }
}

async function executeInsightTask(
  runId: string,
  data: ResolvedTaskData,
  startedAt: Date,
): Promise<void> {
  const insightInput = data.input as PortfolioInsightInput;
  // Sampling settings come from the active DB configuration.
  const generation = data.config.source === "db" ? data.config.generation : undefined;

  const store: InsightRunStore = {
    update: (id, patch) => updateLlmRun(id, patch, { onlyIfActive: true }),
  };

  await runPortfolioInsight({
    runId,
    input: insightInput,
    adapter: data.adapter.adapter,
    prompt: { system: data.prompt.system, user: data.prompt.user },
    promptVersion: data.prompt.promptVersion ?? undefined,
    store,
    startedAt,
    maxAttempts: data.config.maxRetries + 1,
    // DB prompts use arbitrary version labels, so enforce homepage content
    // explicitly rather than relying on the version-based gate.
    requireHomePageContent: true,
    ...(generation ? { generation } : {}),
  });
}

async function executeTaxonomyReviewTask(
  runId: string,
  data: ResolvedTaskData,
  startedAt: Date,
): Promise<void> {
  const taxonomyInput = data.input as TaxonomyReviewInput;
  const generation = data.config.source === "db" ? data.config.generation : undefined;

  const store: TaxonomyReviewRunStore = {
    update: (id, patch) => updateLlmRun(id, patch, { onlyIfActive: true }),
    complete: (id, patch, suggestions) => {
      // `generatedAt` is taxonomy-specific; the unified run already records
      // `completedAt`, so drop it before writing the unified row + suggestions.
      const { generatedAt: _generatedAt, ...rest } = patch;
      return completeLlmRunWithSuggestions(
        id,
        rest,
        suggestions.map(toLlmRunSuggestionInput),
        { onlyIfActive: true },
      );
    },
  };

  await runTaxonomyReview({
    runId,
    input: taxonomyInput,
    adapter: data.adapter.adapter,
    prompt: { system: data.prompt.system, user: data.prompt.user },
    promptVersion: data.prompt.promptVersion ?? undefined,
    store,
    startedAt,
    maxAttempts: data.config.maxRetries + 1,
    ...(generation ? { generation } : {}),
  });
}

/** Map a validated taxonomy suggestion onto a unified review-only suggestion row. */
function toLlmRunSuggestionInput(suggestion: TaxonomySuggestion): CreateLlmRunSuggestionInput {
  return {
    suggestionType: "taxonomy",
    targetGroup: suggestion.targetGroup,
    action: suggestion.action,
    currentValue: suggestion.currentValue ?? null,
    proposedValue: suggestion.proposedValue ?? null,
    originalValue: suggestion.currentValue ?? suggestion.proposedValue ?? null,
    reason: suggestion.reason,
    confidence: suggestion.confidence,
    evidenceRefs: suggestion.evidenceRefs,
    affectedRecords: suggestion.affectedRecords ?? [],
  };
}

/** Best-effort terminal failure write; no-ops if the run is already terminal. */
async function failRun(
  runId: string,
  stage: string,
  message: string,
  startedAt: Date,
): Promise<void> {
  try {
    await updateLlmRun(
      runId,
      {
        status: "failed",
        errorStage: stage,
        errorMessage: message,
        completedAt: new Date(),
        durationMs: Date.now() - startedAt.getTime(),
      },
      { onlyIfActive: true },
    );
  } catch {
    // The run may already be terminal (cancelled or finished) — leave it as-is.
  }
}
