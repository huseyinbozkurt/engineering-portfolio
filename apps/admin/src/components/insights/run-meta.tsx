import type { AiInsightRunRecord } from "@portfolio/db/ai-insight-runs";
import { portfolioInsightInputSchema } from "@portfolio/validators";

export function RunStatusBadge({ status }: { status: AiInsightRunRecord["status"] }) {
  const classes: Record<AiInsightRunRecord["status"], string> = {
    pending: "ui-badge ui-badge-neutral",
    running: "ui-badge ui-badge-accent",
    succeeded: "ui-badge ui-badge-success",
    failed: "ui-badge ui-badge-danger",
    published: "ui-badge ui-badge-accent",
  };

  return <span className={`${classes[status]} capitalize`}>{status}</span>;
}

/** Total records in the run's input snapshot, or null when unreadable. */
export function recordsAnalyzed(run: AiInsightRunRecord): number | null {
  const parsed = portfolioInsightInputSchema.safeParse(run.inputSnapshot);
  if (!parsed.success) {
    return null;
  }
  return Object.values(parsed.data.meta.totals).reduce((sum, value) => sum + value, 0);
}

export function formatDuration(durationMs: number | null): string {
  if (durationMs === null || durationMs < 0) {
    return "—";
  }
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }
  return `${(durationMs / 1000).toFixed(1)}s`;
}
