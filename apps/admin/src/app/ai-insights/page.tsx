import Link from "next/link";

import {
  getActiveLlmTask,
  getLatestSucceededLlmTask,
  type LlmTaskRecord,
} from "@portfolio/db/llm-tasks";

import { EmptyPanel } from "@/components/empty-panel";
import { AiInsightsRunner } from "@/components/ai-insights-runner";
import { PageTitle } from "@/components/page-title";
import { TasksAutoRefresh } from "@/components/tasks-auto-refresh";
import { getPortfolioInsightSnapshot, summarizePortfolioSnapshot } from "@/lib/ai-insights/data";
import type { AiInsightsReport } from "@/lib/ai-insights/types";
import { getLlmConnectionStatuses } from "@/lib/llm-config";

export const dynamic = "force-dynamic";
const taskType = "ai_insights";

export default async function AiInsightsPage() {
  const [snapshot, llmStatuses, activeTask, latestReportTask] = await Promise.all([
    getPortfolioInsightSnapshot(),
    getLlmConnectionStatuses(),
    readActiveAiInsightsTask(),
    readLatestSucceededAiInsightsTask(),
  ]);
  const summary = summarizePortfolioSnapshot(snapshot);
  const onlineLlmCount = llmStatuses.filter((status) => status.status === "online").length;
  const disabledReason = summary.isEmpty
    ? "The portfolio database is empty. Add content before requesting AI insights."
    : activeTask
      ? "An AI Insights task is already running. Wait for it to finish before starting another."
      : onlineLlmCount === 0
      ? "No LLM connection is online. Configure an LLM provider before generating insights."
      : null;
  const latestReport = toAiInsightsReport(latestReportTask?.parsedResponse);

  return (
    <main className="px-5 py-8 lg:px-8">
      <TasksAutoRefresh enabled={Boolean(activeTask)} />
      <PageTitle
        title="AI Insights"
        description="Read-only LLM analysis of existing portfolio content. The evaluator summarizes patterns, gaps, strengths, and improvement opportunities without mutating data."
        actions={
          <Link
            className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink transition hover:border-teal-300/50 hover:bg-white/[0.06]"
            href="/tasks"
          >
            View LLM tasks
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total records" value={Object.values(summary.totals).reduce((total, value) => total + value, 0)} />
        <MetricCard label="Published" value={summary.statusCounts.published ?? 0} />
        <MetricCard label="Skill categories" value={summary.skillDistribution.length} />
        <MetricCard label="Missing case sections" value={summary.missingCaseStudySections} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.75fr)]">
        <div className="rounded-lg border border-line bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold text-ink">Portfolio data snapshot</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(summary.totals).map(([label, value]) => (
              <div key={label} className="rounded-lg border border-line bg-white/[0.025] p-3">
                <p className="text-2xl font-semibold text-ink">{value}</p>
                <p className="mt-1 text-xs capitalize text-muted">{label.replace(/([A-Z])/g, " $1")}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold text-ink">LLM readiness</h2>
          {llmStatuses.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-muted">No LLM providers are configured.</p>
          ) : (
            <div className="mt-4 grid gap-2">
              {llmStatuses.map((status) => (
                <div
                  key={status.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white/[0.025] px-3 py-2"
                >
                  <span className="text-sm text-ink">{status.name}</span>
                  <span
                    className={
                      status.status === "online"
                        ? "rounded-full border border-teal-300/30 bg-teal-300/10 px-2 py-0.5 text-xs text-teal-100"
                        : "rounded-full border border-rose-300/30 bg-rose-500/10 px-2 py-0.5 text-xs text-rose-100"
                    }
                  >
                    {status.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {summary.isEmpty ? (
        <div className="mt-6">
          <EmptyPanel
            title="No portfolio data to analyze"
            description="AI insights need existing lenses, principles, experience, projects, case studies, skills, or tags. The LLM will not be called while the database is empty."
          />
        </div>
      ) : null}

      <AiInsightsRunner
        activeTask={toActiveTaskProps(activeTask)}
        canGenerate={!disabledReason}
        disabledReason={disabledReason}
        latestReport={latestReport}
        latestReportTaskId={latestReport ? latestReportTask?.id ?? null : null}
      />
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-white/[0.03] p-5">
      <p className="text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-2 text-sm text-muted">{label}</p>
    </div>
  );
}

async function readActiveAiInsightsTask(): Promise<LlmTaskRecord | null> {
  try {
    return await getActiveLlmTask(taskType);
  } catch {
    return null;
  }
}

async function readLatestSucceededAiInsightsTask(): Promise<LlmTaskRecord | null> {
  try {
    return await getLatestSucceededLlmTask(taskType);
  } catch {
    return null;
  }
}

function toActiveTaskProps(task: LlmTaskRecord | null) {
  if (!task) {
    return null;
  }

  return {
    id: task.id,
    startedAt: (task.startedAt ?? task.createdAt).toISOString(),
    providerName: task.providerName,
    providerModel: task.providerModel,
  };
}

function toAiInsightsReport(value: unknown): AiInsightsReport | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  return value as AiInsightsReport;
}
