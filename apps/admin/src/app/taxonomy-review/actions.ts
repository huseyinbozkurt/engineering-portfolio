"use server";

import { revalidatePath } from "next/cache";

import { getActiveLlmConfiguration } from "@portfolio/db/llm-configurations";
import { getActivePromptVersion } from "@portfolio/db/llm-prompt-versions";
import {
  bulkSetLlmRunSuggestionStatus,
  completeLlmRunWithSuggestions,
  createLlmRun,
  getActiveLlmRun,
  setLlmRunSuggestionStatus,
  updateLlmRun,
  type CreateLlmRunSuggestionInput,
} from "@portfolio/db/llm-runs";
import { getTaxonomyReviewSource } from "@portfolio/db/taxonomy-review";
import {
  buildTaxonomyReviewInput,
  getTaxonomyReviewPromptVersion,
  getTaxonomyReviewResponseShape,
  isTaxonomyReviewInputEmpty,
  latestTaxonomyReviewPromptVersion,
  resolveWorkflowConfig,
  resolveWorkflowPrompt,
  runTaxonomyReview,
  type LLMGenerationSettings,
} from "@portfolio/llm";
import {
  taxonomySuggestionStatusSchema,
  taxonomyTargetGroupSchema,
  type TaxonomySuggestion,
} from "@portfolio/validators";

import { setFlash } from "@/lib/flash";
import { resolveOnlineLlmAdapter } from "@/lib/llm/adapter";

const TAXONOMY_REVIEW_WORKFLOW = "taxonomyReview" as const;

export interface TaxonomyReviewActionState {
  status: "idle" | "success" | "error";
  message: string;
  runId: string | null;
}

type TaxonomyInput = ReturnType<typeof buildTaxonomyReviewInput>;

interface ResolvedTaxonomyRun {
  prompt: { system: string; user: string };
  promptVersion: string;
  generation: LLMGenerationSettings | undefined;
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

  const [activePrompt, activeConfig] = await Promise.all([
    getActivePromptVersion(TAXONOMY_REVIEW_WORKFLOW),
    getActiveLlmConfiguration(TAXONOMY_REVIEW_WORKFLOW),
  ]);

  const resolvedPrompt = resolveWorkflowPrompt({
    workflow: TAXONOMY_REVIEW_WORKFLOW,
    activeVersion: activePrompt,
    variables: {
      responseShape: getTaxonomyReviewResponseShape(),
      dataset: JSON.stringify(input),
    },
    fallback: () => getTaxonomyReviewPromptVersion(latestTaxonomyReviewPromptVersion).build(input),
  });

  const resolvedConfig = resolveWorkflowConfig(activeConfig);
  const generation = resolvedConfig.source === "db" ? resolvedConfig.generation : undefined;
  const promptVersionLabel = resolvedPrompt.promptVersion ?? latestTaxonomyReviewPromptVersion;

  const startedAt = new Date();

  let runId: string;
  try {
    const run = await createLlmRun({
      workflow: TAXONOMY_REVIEW_WORKFLOW,
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
        "Could not create the taxonomy review run. Apply the database migration and try again.",
      runId: null,
    };
  }

  setTimeout(() => {
    void executeTaxonomyReviewRun(runId, input, startedAt, {
      prompt: { system: resolvedPrompt.system, user: resolvedPrompt.user },
      promptVersion: promptVersionLabel,
      generation,
    });
  }, 0);

  revalidatePath("/taxonomy-review");
  revalidatePath("/llm-runs");

  return {
    status: "success",
    message: "Taxonomy review started. This page refreshes while it works.",
    runId,
  };
}

async function executeTaxonomyReviewRun(
  runId: string,
  input: TaxonomyInput,
  startedAt: Date,
  resolvedRun: ResolvedTaxonomyRun,
): Promise<void> {
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

    await runTaxonomyReview({
      runId,
      input,
      adapter: resolved.adapter,
      prompt: resolvedRun.prompt,
      promptVersion: resolvedRun.promptVersion,
      ...(resolvedRun.generation ? { generation: resolvedRun.generation } : {}),
      store: {
        update: (id, patch) => updateLlmRun(id, patch, { onlyIfActive: true }),
        complete: (id, patch, suggestions) => {
          // `generatedAt` is taxonomy-specific; `completedAt` already carries the
          // finish time on the unified run.
          const { generatedAt: _generatedAt, ...rest } = patch;
          return completeLlmRunWithSuggestions(
            id,
            rest,
            suggestions.map(toLlmRunSuggestionInput),
            { onlyIfActive: true },
          );
        },
      },
      startedAt,
    });
  } catch (error) {
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
      // Leave the last persisted state visible in the admin page.
    }
  } finally {
    revalidatePath("/taxonomy-review");
    revalidatePath("/llm-runs");
    revalidatePath(`/llm-runs/${runId}`);
  }
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
