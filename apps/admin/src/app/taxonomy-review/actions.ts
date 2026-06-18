"use server";

import { revalidatePath } from "next/cache";

import {
  bulkSetLlmRunSuggestionStatus,
  getActiveLlmRun,
  setLlmRunSuggestionStatus,
} from "@portfolio/db/llm-runs";
import {
  runLlmTask,
} from "@portfolio/llm";
import {
  taxonomySuggestionStatusSchema,
  taxonomyTargetGroupSchema,
} from "@portfolio/validators";

import { setFlash } from "@/lib/flash";

const TAXONOMY_REVIEW_WORKFLOW = "taxonomyReview" as const;

export interface TaxonomyReviewActionState {
  status: "idle" | "success" | "error";
  message: string;
  runId: string | null;
}

export async function generateTaxonomyReviewAction(
  _previousState: TaxonomyReviewActionState,
  _formData: FormData,
): Promise<TaxonomyReviewActionState> {
  const active = await getActiveLlmRun(TAXONOMY_REVIEW_WORKFLOW);
  if (active) {
    return {
      status: "error",
      message: "A taxonomy review is already running. Wait for it to finish first.",
      runId: active.id,
    };
  }

  // Trigger only: the package service owns all prompt/config resolution,
  // execution, and unified llm_runs persistence (including suggestions).
  const result = await runLlmTask({
    workflow: TAXONOMY_REVIEW_WORKFLOW,
    entityType: "portfolio",
  });

  if (result.error) {
    return {
      status: "error",
      message: `Failed to start taxonomy review: ${result.error}`,
      runId: null,
    };
  }

  revalidatePath("/taxonomy-review");
  revalidatePath("/llm-runs");

  return {
    status: "success",
    message: "Taxonomy review started. This page refreshes while it works.",
    runId: result.runId,
  };
}

export async function setTaxonomySuggestionStatusAction(
  formData: FormData,
): Promise<void> {
  const id = String(formData.get("suggestionId") ?? "");
  const status = taxonomySuggestionStatusSchema.parse(formData.get("status"));

  await setLlmRunSuggestionStatus(id, status);
  await setFlash(status === "approved" ? "Suggestion approved" : "Suggestion rejected");
  revalidateTaxonomyReview();
}

export async function bulkSetTaxonomySuggestionStatusAction(
  formData: FormData,
): Promise<void> {
  const runId = String(formData.get("runId") ?? "");
  const status = taxonomySuggestionStatusSchema.parse(formData.get("status"));
  const groupValue = formData.get("targetGroup");
  const targetGroup =
    typeof groupValue === "string" && groupValue
      ? taxonomyTargetGroupSchema.parse(groupValue)
      : null;

  // Bulk actions only ever approve or reject from the UI.
  if (status === "pending") {
    return;
  }

  const changed = await bulkSetLlmRunSuggestionStatus({
    runId,
    status,
    targetGroup,
  });

  await setFlash(
    `${changed} pending suggestion${changed === 1 ? "" : "s"} ${status}.`,
    changed > 0 ? "success" : "info",
  );
  revalidateTaxonomyReview();
}

function revalidateTaxonomyReview(): void {
  revalidatePath("/");
  revalidatePath("/taxonomy-review");
  revalidatePath("/llm-runs");
  revalidatePath("/content/skills");
  revalidatePath("/content/tags");
  revalidatePath("/content/lenses");
  revalidatePath("/content/principles");
  revalidatePath("/content/decision-patterns");
}
