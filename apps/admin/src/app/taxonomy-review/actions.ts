"use server";

import { revalidatePath } from "next/cache";

import {
  bulkSetTaxonomySuggestionStatus,
  completeTaxonomyReviewRun,
  createTaxonomyReviewRun,
  getActiveTaxonomyReviewRun,
  getTaxonomyReviewSource,
  setTaxonomySuggestionStatus,
  updateTaxonomyReviewRun,
} from "@portfolio/db/taxonomy-review";
import {
  buildTaxonomyReviewInput,
  getTaxonomyReviewPromptVersion,
  isTaxonomyReviewInputEmpty,
  latestTaxonomyReviewPromptVersion,
  runTaxonomyReview,
} from "@portfolio/llm";
import {
  taxonomySuggestionStatusSchema,
  taxonomyTargetGroupSchema,
} from "@portfolio/validators";

import { setFlash } from "@/lib/flash";
import { resolveOnlineLlmAdapter } from "@/lib/llm/adapter";

export interface TaxonomyReviewActionState {
  status: "idle" | "success" | "error";
  message: string;
  runId: string | null;
}

export async function generateTaxonomyReviewAction(
  _previousState: TaxonomyReviewActionState,
  _formData: FormData,
): Promise<TaxonomyReviewActionState> {
  const active = await getActiveTaxonomyReviewRun();
  if (active) {
    return {
      status: "error",
      message: "A taxonomy review is already running. Wait for it to finish first.",
      runId: active.id,
    };
  }

  const resolved = await resolveOnlineLlmAdapter();
  if (!resolved) {
    return {
      status: "error",
      message: "No online LLM connection is available. Configure a provider before reviewing.",
      runId: null,
    };
  }

  const source = await getTaxonomyReviewSource();
  const input = buildTaxonomyReviewInput(source);

  if (isTaxonomyReviewInputEmpty(input)) {
    return {
      status: "error",
      message: "Add experiences, projects, or case studies before generating taxonomy suggestions.",
      runId: null,
    };
  }

  const promptVersion = latestTaxonomyReviewPromptVersion;
  const prompt = getTaxonomyReviewPromptVersion(promptVersion).build(input);
  const startedAt = new Date();

  let runId: string;
  try {
    const run = await createTaxonomyReviewRun({
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
    const message = error instanceof Error ? error.message : "";
    if (message.includes("taxonomy_review_runs_single_active_idx")) {
      return {
        status: "error",
        message: "A taxonomy review is already running. Wait for it to finish first.",
        runId: null,
      };
    }

    return {
      status: "error",
      message:
        "Could not create the taxonomy review run. Apply the database migration and try again.",
      runId: null,
    };
  }

  setTimeout(() => {
    void executeTaxonomyReviewRun(runId, input, startedAt);
  }, 0);

  revalidatePath("/taxonomy-review");

  return {
    status: "success",
    message: "Taxonomy review started. This page refreshes while it works.",
    runId,
  };
}

async function executeTaxonomyReviewRun(
  runId: string,
  input: ReturnType<typeof buildTaxonomyReviewInput>,
  startedAt: Date,
): Promise<void> {
  try {
    const resolved = await resolveOnlineLlmAdapter();
    if (!resolved) {
      await updateTaxonomyReviewRun(
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

    await runTaxonomyReview({
      runId,
      input,
      adapter: resolved.adapter,
      store: {
        update: (id, patch) =>
          updateTaxonomyReviewRun(id, patch, { onlyIfActive: true }),
        complete: (id, patch, suggestions) =>
          completeTaxonomyReviewRun(id, patch, suggestions),
      },
      startedAt,
    });
  } catch (error) {
    try {
      await updateTaxonomyReviewRun(
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
      // Leave the last persisted state visible in the admin page.
    }
  } finally {
    revalidatePath("/taxonomy-review");
  }
}

export async function setTaxonomySuggestionStatusAction(
  formData: FormData,
): Promise<void> {
  const id = String(formData.get("suggestionId") ?? "");
  const status = taxonomySuggestionStatusSchema.parse(formData.get("status"));

  await setTaxonomySuggestionStatus({ id, status });
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

  const changed = await bulkSetTaxonomySuggestionStatus({
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
  revalidatePath("/content/skills");
  revalidatePath("/content/tags");
  revalidatePath("/content/lenses");
  revalidatePath("/content/principles");
  revalidatePath("/content/decision-patterns");
}
