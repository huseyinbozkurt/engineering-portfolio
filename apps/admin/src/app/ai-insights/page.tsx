import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { getActiveLlmRun, getLlmRuns } from "@portfolio/db/llm-runs";
import { resolveVisibleModelName } from "@portfolio/validators";

import { EmptyPanel } from "@/components/empty-panel";
import { GenerateInsightsButton } from "@/components/insights/generate-insights-button";
import { TestLlmButton } from "@/components/test-llm-button";
import {
  RunStatusBadge,
  formatDuration,
  recordsAnalyzed,
} from "@/components/insights/run-meta";
import { LlmStatusPanel } from "@/components/llm-status-panel";
import { PageTitle } from "@/components/page-title";
import { TasksAutoRefresh } from "@/components/tasks-auto-refresh";
import { getLlmConnectionStatuses } from "@/lib/llm-config";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AiInsightsPage() {
  const [runs, activeRun, llmStatuses] = await Promise.all([
    getLlmRuns({ workflow: "aiInsights", limit: 40 }),
    getActiveLlmRun("aiInsights"),
    getLlmConnectionStatuses(),
  ]);

  const onlineCount = llmStatuses.filter((status) => status.status === "online").length;
  const disabledReason = activeRun
    ? "A run is already in progress. Wait for it to finish (or cancel it from its detail page)."
    : onlineCount === 0
      ? "No LLM connection is online. Configure a provider before generating insights."
      : null;

  return (
    <main className="px-5 py-8 lg:px-8">
      <TasksAutoRefresh enabled={Boolean(activeRun)} />
      <PageTitle
        title="AI Insights"
        description="Evidence-driven analysis of the published portfolio. Every run is validated against the data it was given, stored with its full audit trail, and only goes public when you explicitly publish it."
        actions={<div className="flex items-center gap-3"><TestLlmButton disabled={!Boolean(onlineCount > 0)} /><GenerateInsightsButton disabledReason={disabledReason} /></div>}
      />

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="ui-section-title">Generation runs</h2>
            {runs.length > 0 ? <span className="ui-chip tabular-nums">{runs.length} runs</span> : null}
          </div>
          <Link href="/llm-runs?workflow=aiInsights" className="ui-btn-outline">
            View in LLM Runs
          </Link>
        </div>

        {runs.length === 0 ? (
          <EmptyPanel
            title="No insight runs yet"
            description="Generate the first run to analyze the published portfolio. Runs appear here with their full audit trail."
          />
        ) : (
          <div className="ui-card overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[52rem] text-left text-sm">
                <thead className="ui-table-head border-b border-line bg-white/[0.015]">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 font-semibold">Model</th>
                    <th className="px-4 py-2.5 font-semibold">Records</th>
                    <th className="px-4 py-2.5 font-semibold">Tokens</th>
                    <th className="px-4 py-2.5 font-semibold">Duration</th>
                    <th className="px-4 py-2.5 font-semibold">Created</th>
                    <th className="px-4 py-2.5">
                      <span className="sr-only">Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {runs.map((run) => (
                    <tr key={run.id} className="ui-row">
                      <td className="px-4 py-3">
                        <RunStatusBadge status={run.status} />
                      </td>
                      <td className="px-4 py-3 text-muted">
                        <span className="text-ink">
                          {resolveVisibleModelName({
                            visibleModelName: run.visibleModelName,
                            provider: run.provider,
                            model: run.model,
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted">
                        {recordsAnalyzed(run) ?? "—"}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted">
                        {run.tokenUsage?.totalTokens ?? "—"}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted">
                        {formatDuration(run.durationMs)}
                      </td>
                      <td className="px-4 py-3 text-muted">{formatDate(run.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/ai-insights/runs/${run.id}`}
                          className="ui-btn-outline"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="ui-section-title">Public page</h2>
          <a
            href={`${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/ai-insights`}
            target="_blank"
            rel="noreferrer"
            className="ui-btn-outline"
          >
            View public /ai-insights <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>
        <p className="max-w-3xl text-sm leading-6 text-muted">
          The public page renders only the currently published run — it never calls the LLM. Publish
          a succeeded run from its detail page to update the public report.
        </p>
      </section>

      <LlmStatusPanel statuses={llmStatuses} />
    </main>
  );
}
