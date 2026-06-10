"use server";

import { revalidatePath } from "next/cache";

import {
  createAiInsightRun,
  getActiveAiInsightRun,
  publishAiInsightRun,
  unpublishAiInsightRun,
  updateAiInsightRun,
} from "@portfolio/db/ai-insight-runs";
import { getPublishedInsightSource } from "@portfolio/db/queries";
import {
  buildPortfolioInsightInput,
  createInsightLogger,
  getInsightPromptVersion,
  isInsightInputEmpty,
  latestInsightPromptVersion,
  runPortfolioInsight,
} from "@portfolio/llm";

import { resolveOnlineLlmAdapter } from "@/lib/llm/adapter";

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

/**
 * Starts a new insight generation run. Admin-only by construction: this server
 * action exists solely in the admin app — the public site contains no
 * generation code and only reads published runs.
 */
export async function generateAiInsightsAction(
  _previousState: AiInsightsActionState,
  _formData: FormData,
): Promise<AiInsightsActionState> {
  const active = await getActiveAiInsightRun();
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

  const promptVersion = latestInsightPromptVersion;
  const prompt = getInsightPromptVersion(promptVersion).build(input);
  const startedAt = new Date();

  let runId: string;
  try {
    const run = await createAiInsightRun({
      status: "running",
      provider: resolved.adapter.getProvider(),
      model: resolved.adapter.getModel() ?? null,
      promptVersion,
      promptSystem: prompt.system,
      promptUser: prompt.user,
      inputSnapshot: input,
      startedAt,
    });
    runId = run.id;
  } catch (error) {
    // The partial unique index is the concurrency backstop for double-starts.
    const message = error instanceof Error ? error.message : "";
    if (message.includes("ai_insight_runs_single_active_idx")) {
      return {
        status: "error",
        message: "An insight run is already in progress. Wait for it to finish first.",
        report: null,
        taskId: null,
      };
    }
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
    void executeInsightRun(runId, input, startedAt);
  }, 0);

  revalidatePath("/ai-insights");

  return {
    status: "success",
    message: "Insight run started. The table below refreshes while it works.",
    report: null,
    taskId: runId,
  };
}

async function executeInsightRun(
  runId: string,
  input: Awaited<ReturnType<typeof buildPortfolioInsightInput>>,
  startedAt: Date,
): Promise<void> {
  const logger = createInsightLogger(runId);

  try {
    const resolved = await resolveOnlineLlmAdapter();
    if (!resolved) {
      await updateAiInsightRun(
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
      // Terminal writes only land while the run is still active, so a manual
      // cancel and a late runner result can never clobber each other.
      store: { update: (id, patch) => updateAiInsightRun(id, patch, { onlyIfActive: true }) },
      logger,
      startedAt,
    });
  } catch (error) {
    logger.error("saved", {
      status: "failed",
      message: error instanceof Error ? error.message : "Unexpected runner failure.",
    });
    try {
      await updateAiInsightRun(
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
  }
}

export async function publishInsightRunAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const run = await publishAiInsightRun(id);

  createInsightLogger(run.id).event("published", { promptVersion: run.promptVersion });
  revalidatePath("/ai-insights");
  revalidatePath(`/ai-insights/runs/${run.id}`);
}

export async function unpublishInsightRunAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const run = await unpublishAiInsightRun(id);

  revalidatePath("/ai-insights");
  revalidatePath(`/ai-insights/runs/${run.id}`);
}

/**
 * Best-effort cancellation: marks a stuck pending/running run as failed so a
 * new run can start. Any in-flight provider result is discarded because both
 * terminal writers use `onlyIfActive`, so whichever lands second no-ops.
 */
export async function cancelInsightRunAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");

  try {
    await updateAiInsightRun(
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
}
