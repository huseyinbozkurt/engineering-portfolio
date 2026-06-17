"use server";

import { revalidatePath } from "next/cache";

import { getActiveLlmConfiguration } from "@portfolio/db/llm-configurations";
import { getActivePromptVersion } from "@portfolio/db/llm-prompt-versions";
import {
  createLlmRun,
  getActiveLlmRun,
  publishLlmRun,
  unpublishLlmRun,
  updateLlmRun,
} from "@portfolio/db/llm-runs";
import { getPublishedInsightSource } from "@portfolio/db/queries";
import {
  buildPortfolioInsightInput,
  createInsightLogger,
  getInsightPromptVersion,
  getInsightResponseShape,
  isInsightInputEmpty,
  latestInsightPromptVersion,
  resolveWorkflowConfig,
  resolveWorkflowPrompt,
  runPortfolioInsight,
  type LLMGenerationSettings,
} from "@portfolio/llm";

import { resolveOnlineLlmAdapter } from "@/lib/llm/adapter";

const AI_INSIGHTS_WORKFLOW = "aiInsights" as const;

/**
 * Action state consumed by the Generate button via `useActionState`.
 * `taskId` carries the created run id (the button refreshes when it appears);
 * `report` is always null — runs are reviewed on their detail page, never
 * returned inline.
 */
export interface AiInsightsActionState {
  status: "idle" | "success" | "error";
  message: string;
  report: null;
  taskId: string | null;
}

type InsightInput = ReturnType<typeof buildPortfolioInsightInput>;

interface ResolvedInsightRun {
  prompt: { system: string; user: string };
  promptVersion: string;
  generation: LLMGenerationSettings | undefined;
}

/**
 * Starts a new insight generation run. Admin-only by construction: this server
 * action exists solely in the admin app — the public site contains no
 * generation code and only reads published runs.
 *
 * Every execution is recorded in the unified `llm_runs` table under
 * `workflow = "aiInsights"`; there is no longer a separate AI Insights run
 * table. The prompt and configuration are resolved from DB-managed records when
 * present and otherwise fall back to the hardcoded prompt / .env adapter, with
 * the provenance persisted on the run.
 */
export async function generateAiInsightsAction(
  _previousState: AiInsightsActionState,
  _formData: FormData,
): Promise<AiInsightsActionState> {
  const active = await getActiveLlmRun(AI_INSIGHTS_WORKFLOW);
  if (active) {
    return {
      status: "error",
      message: "An insight run is already in progress. Wait for it to finish first.",
      report: null,
      taskId: active.id,
    };
  }

  const resolved = await resolveOnlineLlmAdapter();
  if (!resolved) {
    return {
      status: "error",
      message: "No online LLM connection is available. Configure a provider before generating.",
      report: null,
      taskId: null,
    };
  }

  const source = await getPublishedInsightSource();
  const input = buildPortfolioInsightInput(source);

  if (isInsightInputEmpty(input)) {
    return {
      status: "error",
      message: "Publish portfolio records before generating insights — the snapshot is empty.",
      report: null,
      taskId: null,
    };
  }

  const bootLogger = createInsightLogger(null);
  bootLogger.event("input-created", {
    totals: input.meta.totals,
    draftCounts: input.meta.draftCounts,
  });

  // Resolve the prompt (DB-managed version → hardcoded fallback) and the
  // configuration (DB-managed config → .env adapter fallback). Both record where
  // they came from so the run carries full provenance.
  const [activePrompt, activeConfig] = await Promise.all([
    getActivePromptVersion(AI_INSIGHTS_WORKFLOW),
    getActiveLlmConfiguration(AI_INSIGHTS_WORKFLOW),
  ]);

  const resolvedPrompt = resolveWorkflowPrompt({
    workflow: AI_INSIGHTS_WORKFLOW,
    activeVersion: activePrompt,
    variables: {
      responseShape: getInsightResponseShape(),
      dataset: JSON.stringify(input),
    },
    fallback: () => getInsightPromptVersion(latestInsightPromptVersion).build(input),
  });

  const resolvedConfig = resolveWorkflowConfig(activeConfig);

  // Only send explicit sampling settings when they come from a DB config. The
  // .env fallback keeps today's behaviour: the adapter applies its own
  // env-driven defaults (LLM_ANALYSIS_*) rather than being forced to the
  // structured-profile ceiling.
  const generation = resolvedConfig.source === "db" ? resolvedConfig.generation : undefined;
  const promptVersionLabel = resolvedPrompt.promptVersion ?? latestInsightPromptVersion;

  const startedAt = new Date();

  let runId: string;
  try {
    const run = await createLlmRun({
      workflow: AI_INSIGHTS_WORKFLOW,
      targetType: "portfolio",
      targetId: null,
      status: "running",
      provider: resolvedConfig.provider ?? resolved.adapter.getProvider(),
      model: resolvedConfig.model ?? resolved.adapter.getModel() ?? null,
      visibleModelName: resolvedConfig.visibleModelName,
      promptSource: resolvedPrompt.source,
      promptVersionId: resolvedPrompt.promptVersionId,
      promptVersion: resolvedPrompt.promptVersion,
      promptName: resolvedPrompt.promptName,
      configSource: resolvedConfig.source,
      llmConfigurationId: resolvedConfig.configurationId,
      temperature: resolvedConfig.temperature,
      topP: resolvedConfig.topP,
      maxTokens: resolvedConfig.maxTokens,
      maxRetries: resolvedConfig.maxRetries,
      timeoutMs: resolvedConfig.timeoutMs,
      promptSystem: resolvedPrompt.system,
      promptUser: resolvedPrompt.user,
      inputSnapshot: input,
      startedAt,
    });
    runId = run.id;
  } catch {
    return {
      status: "error",
      message:
        "Could not create the insight run. Apply the database migration (pnpm db:migrate) and try again.",
      report: null,
      taskId: null,
    };
  }

  // Fire-and-forget so the action returns immediately; the runs table
  // auto-refreshes while the run is active.
  setTimeout(() => {
    void executeInsightRun(runId, input, startedAt, {
      prompt: { system: resolvedPrompt.system, user: resolvedPrompt.user },
      promptVersion: promptVersionLabel,
      generation,
    });
  }, 0);

  revalidatePath("/ai-insights");
  revalidatePath("/llm-runs");

  return {
    status: "success",
    message: "Insight run started. The table below refreshes while it works.",
    report: null,
    taskId: runId,
  };
}

async function executeInsightRun(
  runId: string,
  input: InsightInput,
  startedAt: Date,
  resolvedRun: ResolvedInsightRun,
): Promise<void> {
  const logger = createInsightLogger(runId);

  try {
    const resolved = await resolveOnlineLlmAdapter();
    if (!resolved) {
      await updateLlmRun(
        runId,
        {
          status: "failed",
          errorStage: "request",
          errorMessage: "The selected LLM connection went offline before the run started.",
          completedAt: new Date(),
          durationMs: Date.now() - startedAt.getTime(),
        },
        { onlyIfActive: true },
      );
      return;
    }

    await runPortfolioInsight({
      runId,
      input,
      adapter: resolved.adapter,
      prompt: resolvedRun.prompt,
      promptVersion: resolvedRun.promptVersion,
      ...(resolvedRun.generation ? { generation: resolvedRun.generation } : {}),
      // Terminal writes only land while the run is still active, so a manual
      // cancel and a late runner result can never clobber each other.
      store: { update: (id, patch) => updateLlmRun(id, patch, { onlyIfActive: true }) },
      logger,
      startedAt,
    });
  } catch (error) {
    logger.error("saved", {
      status: "failed",
      message: error instanceof Error ? error.message : "Unexpected runner failure.",
    });
    try {
      await updateLlmRun(
        runId,
        {
          status: "failed",
          errorStage: "runner",
          errorMessage: error instanceof Error ? error.message : "Unexpected runner failure.",
          completedAt: new Date(),
          durationMs: Date.now() - startedAt.getTime(),
        },
        { onlyIfActive: true },
      );
    } catch {
      // Nothing left to do — the run stays visibly stuck and can be cancelled.
    }
  } finally {
    revalidatePath("/ai-insights");
    revalidatePath(`/ai-insights/runs/${runId}`);
    revalidatePath("/llm-runs");
    revalidatePath(`/llm-runs/${runId}`);
  }
}

export async function publishInsightRunAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const run = await publishLlmRun(id);

  createInsightLogger(run.id).event("published", { promptVersion: run.promptVersion });
  revalidatePath("/ai-insights");
  revalidatePath(`/ai-insights/runs/${run.id}`);
  revalidatePath("/llm-runs");
}

export async function unpublishInsightRunAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const run = await unpublishLlmRun(id);

  revalidatePath("/ai-insights");
  revalidatePath(`/ai-insights/runs/${run.id}`);
  revalidatePath("/llm-runs");
}

/**
 * Best-effort cancellation: marks a stuck pending/running run as failed so a
 * new run can start. Any in-flight provider result is discarded because both
 * terminal writers use `onlyIfActive`, so whichever lands second no-ops.
 */
export async function cancelInsightRunAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");

  try {
    await updateLlmRun(
      id,
      {
        status: "failed",
        errorStage: "cancelled",
        errorMessage: "Cancelled from the admin before completion.",
        completedAt: new Date(),
      },
      { onlyIfActive: true },
    );
  } catch {
    // The run finished in the meantime — nothing to cancel.
  }

  revalidatePath("/ai-insights");
  revalidatePath(`/ai-insights/runs/${id}`);
  revalidatePath("/llm-runs");
}
