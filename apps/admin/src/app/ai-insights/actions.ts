"use server";

import { revalidatePath } from "next/cache";

import {
  getActiveLlmRun,
  publishLlmRun,
  unpublishLlmRun,
  updateLlmRun,
} from "@portfolio/db/llm-runs";
import { runLlmTask } from "@portfolio/llm";

const AI_INSIGHTS_WORKFLOW = "aiInsights" as const;

export interface AiInsightsActionState {
  status: "idle" | "success" | "error";
  message: string;
  report: null;
  taskId: string | null;
  /** True when the run reused a cached output instead of calling the LLM. */
  cacheHit?: boolean;
  /** The prior run whose output was reused (cache hit only). */
  cachedRunId?: string | null;
}

/**
 * Starts a new insight generation run. Admin-only by construction.
 */
export async function generateAiInsightsAction(
  _previousState: AiInsightsActionState,
  formData: FormData,
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

  // `forceRefresh` bypasses the dataset/prompt/model/config cache to regenerate
  // even when nothing changed (prompt experimentation, model comparison).
  const forceRefresh = String(formData.get("forceRefresh") ?? "") === "true";

  // Trigger only: the package service owns all prompt/config resolution,
  // execution, caching, and unified llm_runs persistence.
  const result = await runLlmTask({
    workflow: AI_INSIGHTS_WORKFLOW,
    entityType: "portfolio",
    forceRefresh,
  });

  if (result.error) {
    return {
      status: "error",
      message: `Failed to start insight run: ${result.error}`,
      report: null,
      taskId: null,
    };
  }

  revalidatePath("/ai-insights");
  revalidatePath("/llm-runs");

  return {
    status: "success",
    message: result.cacheHit
      ? "Dataset, prompt, and config unchanged — reused the cached AI insight (no LLM call)."
      : "Insight run started. The table below refreshes while it works.",
    report: null,
    taskId: result.runId,
    cacheHit: result.cacheHit ?? false,
    cachedRunId: result.cachedRunId ?? null,
  };
}

export async function publishInsightRunAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const run = await publishLlmRun(id);
  revalidatePath("/ai-insights");
  revalidatePath(`/ai-insights/runs/${run.id}`);
  revalidatePath("/llm-runs");
}

export async function unpublishInsightRunAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  await unpublishLlmRun(id);
  revalidatePath("/ai-insights");
  revalidatePath(`/ai-insights/runs/${id}`);
  revalidatePath("/llm-runs");
}

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
