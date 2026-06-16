import Link from "next/link";

import { getLlmRuns, type LlmRunListFilter } from "@portfolio/db/llm-runs";
import {
  LLM_WORKFLOW_LABELS,
  LLM_WORKFLOWS,
  resolveVisibleModelName,
  type LlmWorkflow,
} from "@portfolio/validators";

import { PageTitle } from "@/components/page-title";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUSES = ["pending", "running", "succeeded", "failed", "published", "reviewed"] as const;
const PROMPT_SOURCES = ["db", "codeFallback"] as const;
const CONFIG_SOURCES = ["db", "envFallback"] as const;

const statusBadge: Record<string, string> = {
  pending: "ui-badge-neutral",
  running: "ui-badge-warning",
  succeeded: "ui-badge-success",
  failed: "ui-badge-danger",
  published: "ui-badge-accent",
  reviewed: "ui-badge-success",
};

interface LlmRunsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function one(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.trim() ? v.trim() : undefined;
}

export default async function LlmRunsPage({ searchParams }: LlmRunsPageProps) {
  const sp = await searchParams;
  const filter: LlmRunListFilter = { limit: 100 };
  const workflow = one(sp.workflow);
  const status = one(sp.status);
  const provider = one(sp.provider);
  const promptSource = one(sp.promptSource);
  const configSource = one(sp.configSource);
  const from = one(sp.from);
  const to = one(sp.to);

  if (workflow) filter.workflow = workflow as LlmWorkflow;
  if (status) filter.status = status as NonNullable<LlmRunListFilter["status"]>;
  if (provider) filter.provider = provider;
  if (promptSource) filter.promptSource = promptSource as NonNullable<LlmRunListFilter["promptSource"]>;
  if (configSource) filter.configSource = configSource as NonNullable<LlmRunListFilter["configSource"]>;
  if (from) filter.from = new Date(from);
  if (to) filter.to = new Date(`${to}T23:59:59`);

  const runs = await getLlmRuns(filter);

  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title="LLM Runs"
        description="Unified audit log of every LLM execution: prompt/config provenance, rendered prompts, output, attempts, and token usage."
      />

      <form className="ui-card mb-6 flex flex-wrap items-end gap-3 p-4" method="get">
        <label className="ui-field">
          <span className="ui-label">Workflow</span>
          <select name="workflow" className="ui-select" defaultValue={workflow ?? ""}>
            <option value="">All</option>
            {LLM_WORKFLOWS.map((value) => (
              <option key={value} value={value}>
                {LLM_WORKFLOW_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="ui-field">
          <span className="ui-label">Status</span>
          <select name="status" className="ui-select" defaultValue={status ?? ""}>
            <option value="">All</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="ui-field">
          <span className="ui-label">Provider</span>
          <input name="provider" className="ui-input" defaultValue={provider ?? ""} placeholder="any" />
        </label>
        <label className="ui-field">
          <span className="ui-label">Prompt source</span>
          <select name="promptSource" className="ui-select" defaultValue={promptSource ?? ""}>
            <option value="">All</option>
            {PROMPT_SOURCES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="ui-field">
          <span className="ui-label">Config source</span>
          <select name="configSource" className="ui-select" defaultValue={configSource ?? ""}>
            <option value="">All</option>
            {CONFIG_SOURCES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="ui-field">
          <span className="ui-label">From</span>
          <input type="date" name="from" className="ui-input" defaultValue={from ?? ""} />
        </label>
        <label className="ui-field">
          <span className="ui-label">To</span>
          <input type="date" name="to" className="ui-input" defaultValue={to ?? ""} />
        </label>
        <div className="flex gap-2">
          <button type="submit" className="ui-btn-primary">
            Filter
          </button>
          <a href="/llm-runs" className="ui-btn-secondary">
            Reset
          </a>
        </div>
      </form>

      {runs.length === 0 ? (
        <p className="text-sm text-muted">No LLM runs match these filters yet.</p>
      ) : (
        <div className="ui-card overflow-x-auto p-0 shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="ui-table-head">
              <tr>
                <th className="px-4 py-3">Workflow</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Prompt</th>
                <th className="px-4 py-3">Config</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Duration</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-t border-line hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <Link className="font-medium text-accent-200 hover:underline" href={`/llm-runs/${run.id}`}>
                      {LLM_WORKFLOW_LABELS[run.workflow] ?? run.workflow}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusBadge[run.status] ?? "ui-badge-neutral"}>{run.status}</span>
                    {run.status === "failed" && run.errorMessage ? (
                      <p className="mt-1 max-w-xs truncate text-xs text-danger-200" title={run.errorMessage}>
                        {run.errorStage ? `[${run.errorStage}] ` : ""}
                        {run.errorMessage}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {run.targetType ? `${run.targetType}${run.targetId ? ` · ${run.targetId.slice(0, 8)}` : ""}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {resolveVisibleModelName({
                      visibleModelName: run.visibleModelName,
                      provider: run.provider,
                      model: run.model,
                    })}
                  </td>
                  <td className="px-4 py-3 text-muted">{run.promptSource}</td>
                  <td className="px-4 py-3 text-muted">{run.configSource}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(run.createdAt)}</td>
                  <td className="px-4 py-3 text-muted">
                    {run.durationMs != null ? `${(run.durationMs / 1000).toFixed(1)}s` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
