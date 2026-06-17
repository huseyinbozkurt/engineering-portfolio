import { getLatestPublishedAiInsightRun } from "@portfolio/db/ai-insight-runs";
import { getLatestPublishedLlmRun } from "@portfolio/db/llm-runs";

/**
 * Normalized view of the single published AI Insights output the public site
 * renders. Source of truth is the unified `llm_runs` table
 * (`workflow = "aiInsights"`); the legacy `ai_insight_runs` table is consulted
 * only as a read fallback when no consolidated run has been published yet, so
 * pre-migration published output is never lost.
 */
export interface PublishedInsight {
  outputJson: unknown;
  inputSnapshot: unknown;
  provider: string | null;
  model: string | null;
  visibleModelName: string | null;
  completedAt: Date | null;
  createdAt: Date;
}

export async function getPublishedInsight(): Promise<PublishedInsight | null> {
  const run = await getLatestPublishedLlmRun("aiInsights");
  if (run) {
    return {
      outputJson: run.outputJson,
      inputSnapshot: run.inputSnapshot,
      provider: run.provider,
      model: run.model,
      visibleModelName: run.visibleModelName,
      completedAt: run.completedAt,
      createdAt: run.createdAt,
    };
  }

  const legacy = await getLatestPublishedAiInsightRun();
  if (legacy) {
    return {
      outputJson: legacy.outputJson,
      inputSnapshot: legacy.inputSnapshot,
      provider: legacy.provider,
      model: legacy.model,
      visibleModelName: null,
      completedAt: legacy.completedAt,
      createdAt: legacy.createdAt,
    };
  }

  return null;
}
