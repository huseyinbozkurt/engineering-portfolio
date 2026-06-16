import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getAiInsightRun,
  getAiInsightRuns,
  type AiInsightRunRecord,
} from "@portfolio/db/ai-insight-runs";
import {
  portfolioInsightInputSchema,
  portfolioInsightOutputSchema,
  getAiModelDisplayName,
  type PortfolioInsightOutput,
} from "@portfolio/validators";

import { FormDisclosure } from "@/components/forms/form-section";
import {
  ConfidenceBadge,
  InsightReportView,
  type EvidenceResolver,
} from "@/components/insights/insight-report-view";
import {
  CancelRunButton,
  PublishRunButton,
  UnpublishRunButton,
} from "@/components/insights/run-controls";
import {
  RunStatusBadge,
  formatDuration,
  recordsAnalyzed,
} from "@/components/insights/run-meta";
import { Breadcrumbs } from "@/components/nav/breadcrumbs";
import { TasksAutoRefresh } from "@/components/tasks-auto-refresh";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

interface RunPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ vs?: string }>;
}

export default async function InsightRunPage({ params, searchParams }: RunPageProps) {
  const [{ id }, { vs }] = await Promise.all([params, searchParams]);
  const [run, allRuns] = await Promise.all([getAiInsightRun(id), getAiInsightRuns(40)]);

  if (!run) {
    notFound();
  }

  const compareRun = vs ? await getAiInsightRun(vs) : null;
  const output = parseOutput(run);
  const resolve = buildResolver(run);
  const isActive = run.status === "pending" || run.status === "running";

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <TasksAutoRefresh enabled={isActive} />

      <header className="border-b border-line pb-6">
        <Breadcrumbs current={`Run ${run.id.slice(0, 8)}`} />

        <div className="mt-5 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-200/90">
              Insight run
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="ui-page-title">{formatDate(run.createdAt)}</h1>
              <RunStatusBadge status={run.status} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="ui-chip">
                {getAiModelDisplayName({ provider: run.provider, model: run.model })}
              </span>
              <span className="ui-chip tabular-nums">{formatDuration(run.durationMs)}</span>
              <span className="ui-chip tabular-nums">
                {run.tokenUsage?.totalTokens ?? "—"} tokens
              </span>
              <span className="ui-chip tabular-nums">
                {recordsAnalyzed(run) ?? "—"} records analyzed
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {run.status === "succeeded" ? <PublishRunButton runId={run.id} /> : null}
            {run.status === "published" ? (
              <>
                <a
                  href={`${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/ai-insights`}
                  target="_blank"
                  rel="noreferrer"
                  className="ui-btn-secondary"
                >
                  View public page <ExternalLink className="size-3.5" aria-hidden />
                </a>
                <UnpublishRunButton runId={run.id} />
              </>
            ) : null}
            {isActive ? <CancelRunButton runId={run.id} /> : null}
          </div>
        </div>
      </header>

      {isActive ? (
        <div className="mt-8 rounded-2xl border border-accent-400/30 bg-accent-500/[0.06] p-6 text-sm leading-6 text-ink/85">
          The run is in progress — this page refreshes automatically. Generation typically takes
          under two minutes depending on the provider.
        </div>
      ) : null}

      {run.status === "failed" ? (
        <div className="mt-8 rounded-2xl border border-danger-400/30 bg-danger-500/[0.06] p-6">
          <h2 className="text-base font-semibold text-danger-100">
            Run failed during the {run.errorStage ?? "unknown"} stage
          </h2>
          <p className="mt-2 text-sm leading-6 text-danger-200/90">
            {run.errorMessage ?? "No error message was recorded."}
          </p>
          <p className="mt-3 text-xs leading-5 text-muted">
            Invalid output is never accepted: a failed run stores its raw response for debugging
            (below) but exposes nothing to the public site.
          </p>
        </div>
      ) : null}

      {output ? (
        <div className="mt-8">
          <InsightReportView output={output} resolve={resolve} />
        </div>
      ) : null}

      {compareRun ? (
        <section className="mt-8">
          <CompareView baseRun={run} baseOutput={output} otherRun={compareRun} />
        </section>
      ) : null}

      <section className="mt-8 grid gap-4">
        {allRuns.length > 1 ? (
          <form method="get" className="ui-card flex flex-wrap items-end gap-3 p-5 shadow-card">
            <label className="ui-field max-w-md flex-1">
              <span className="ui-label">Compare against another run</span>
              <select name="vs" defaultValue={vs ?? ""} className="ui-select">
                <option value="">— Select a run —</option>
                {allRuns
                  .filter((candidate) => candidate.id !== run.id)
                  .map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {formatDate(candidate.createdAt)} · {candidate.status} ·{" "}
                      {getAiModelDisplayName({
                        provider: candidate.provider,
                        model: candidate.model,
                      })}
                    </option>
                  ))}
              </select>
            </label>
            <button type="submit" className="ui-btn-secondary">
              Compare
            </button>
            {compareRun ? (
              <Link href={`/ai-insights/runs/${run.id}`} className="ui-btn-ghost">
                Clear comparison
              </Link>
            ) : null}
          </form>
        ) : null}

        <FormDisclosure
          title="Debug"
          description="Exact prompts sent, validated JSON, validation notes, attempts, and the raw provider response. No secrets are stored."
        >
          <div className="grid gap-4">
            <DebugBlock title="System prompt">
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-black/30 p-4 text-xs leading-5 text-ink/80">
                {run.promptSystem || "—"}
              </pre>
            </DebugBlock>

            <DebugBlock title="User prompt">
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-black/30 p-4 text-xs leading-5 text-ink/70">
                {run.promptUser || "—"}
              </pre>
            </DebugBlock>

            <DebugBlock title={`Validation notes (${run.validationNotes?.length ?? 0})`}>
              {run.validationNotes && run.validationNotes.length > 0 ? (
                <ul className="grid gap-1.5">
                  {run.validationNotes.map((note, index) => (
                    <li
                      key={index}
                      className="rounded-lg border border-warning-200/20 bg-warning-200/[0.05] px-3 py-2 text-xs leading-5 text-warning-100"
                    >
                      {note}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted">
                  No adjustments — the output passed evidence validation untouched.
                </p>
              )}
            </DebugBlock>

            <DebugBlock title={`Attempts (${run.attempts?.length ?? 0})`}>
              {run.attempts && run.attempts.length > 0 ? (
                <ul className="grid gap-1.5 text-xs text-muted">
                  {run.attempts.map((attempt) => (
                    <li
                      key={attempt.attemptNo}
                      className="rounded-lg border border-line bg-white/[0.02] px-3 py-2"
                    >
                      #{attempt.attemptNo} ·{" "}
                      {getAiModelDisplayName({
                        provider: attempt.provider,
                        model: attempt.model,
                      })}{" "}
                      ·{" "}
                      {attempt.errorMessage ? (
                        <span className="text-danger-200">
                          {attempt.validationErrorStage
                            ? `[${attempt.validationErrorStage}] `
                            : ""}
                          {attempt.errorMessage}
                        </span>
                      ) : (
                        <span className="text-success-200">ok</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted">No attempts recorded.</p>
              )}
            </DebugBlock>

            <DebugBlock title="Validated output JSON">
              <pre className="max-h-96 overflow-auto rounded-xl border border-line bg-black/30 p-4 text-xs leading-5 text-ink/80">
                {run.outputJson ? JSON.stringify(run.outputJson, null, 2) : "—"}
              </pre>
            </DebugBlock>

            <DebugBlock title="Raw provider response">
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-black/30 p-4 text-xs leading-5 text-ink/70">
                {run.rawResponse ?? "—"}
              </pre>
            </DebugBlock>

            <DebugBlock title="Input snapshot">
              <pre className="max-h-96 overflow-auto rounded-xl border border-line bg-black/30 p-4 text-xs leading-5 text-ink/70">
                {JSON.stringify(run.inputSnapshot, null, 2)}
              </pre>
            </DebugBlock>
          </div>
        </FormDisclosure>
      </section>
    </main>
  );
}

function DebugBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-ink">{title}</h3>
      {children}
    </div>
  );
}

function CompareView({
  baseRun,
  baseOutput,
  otherRun,
}: {
  baseRun: AiInsightRunRecord;
  baseOutput: PortfolioInsightOutput | null;
  otherRun: AiInsightRunRecord;
}) {
  const otherOutput = parseOutput(otherRun);

  const metaRows: Array<[string, string, string]> = [
    ["Status", baseRun.status, otherRun.status],
    [
      "Model",
      getAiModelDisplayName({ provider: baseRun.provider, model: baseRun.model }),
      getAiModelDisplayName({ provider: otherRun.provider, model: otherRun.model }),
    ],
    ["Duration", formatDuration(baseRun.durationMs), formatDuration(otherRun.durationMs)],
    [
      "Total tokens",
      String(baseRun.tokenUsage?.totalTokens ?? "—"),
      String(otherRun.tokenUsage?.totalTokens ?? "—"),
    ],
    [
      "Records analyzed",
      String(recordsAnalyzed(baseRun) ?? "—"),
      String(recordsAnalyzed(otherRun) ?? "—"),
    ],
    [
      "Validation notes",
      String(baseRun.validationNotes?.length ?? 0),
      String(otherRun.validationNotes?.length ?? 0),
    ],
  ];

  return (
    <div className="ui-card p-6 shadow-card">
      <h2 className="text-lg font-semibold text-ink">Run comparison</h2>
      <p className="mt-1 text-sm text-muted">
        This run ({formatDate(baseRun.createdAt)}) vs {formatDate(otherRun.createdAt)}.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="ui-table-head border-b border-line">
            <tr>
              <th className="py-2 pr-4 font-semibold">Metadata</th>
              <th className="py-2 pr-4 font-semibold">This run</th>
              <th className="py-2 font-semibold">Compared run</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {metaRows.map(([label, left, right]) => (
              <tr key={label}>
                <td className="py-2.5 pr-4 text-muted">{label}</td>
                <td
                  className={`py-2.5 pr-4 ${left !== right ? "font-medium text-warning-100" : "text-ink"}`}
                >
                  {left}
                </td>
                <td
                  className={`py-2.5 ${left !== right ? "font-medium text-warning-100" : "text-ink"}`}
                >
                  {right}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <CompareColumn title="This run" output={baseOutput} />
        <CompareColumn title="Compared run" output={otherOutput} />
      </div>
    </div>
  );
}

function CompareColumn({
  title,
  output,
}: {
  title: string;
  output: PortfolioInsightOutput | null;
}) {
  if (!output) {
    return (
      <div className="rounded-xl border border-line bg-white/[0.02] p-4 text-sm text-muted">
        {title}: no validated output (failed or still running).
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-white/[0.02] p-4">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <div className="mt-2 flex items-center gap-2">
        <ConfidenceBadge confidence={output.executiveSummary.confidence} />
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">{output.executiveSummary.summary}</p>
      <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted/70">
        Strength signals
      </h4>
      <ul className="mt-2 grid gap-1.5">
        {output.strengthSignals.map((signal) => (
          <li key={signal.title} className="flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate text-ink/90">{signal.title}</span>
            <ConfidenceBadge confidence={signal.confidence} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function parseOutput(run: AiInsightRunRecord): PortfolioInsightOutput | null {
  if (!run.outputJson) {
    return null;
  }
  const parsed = portfolioInsightOutputSchema.safeParse(run.outputJson);
  return parsed.success ? parsed.data : null;
}

function buildResolver(run: AiInsightRunRecord): EvidenceResolver {
  const parsed = portfolioInsightInputSchema.safeParse(run.inputSnapshot);
  if (!parsed.success) {
    return () => null;
  }

  const labels = new Map<string, { title: string; type: string }>();
  for (const records of Object.values(parsed.data.records)) {
    for (const record of records) {
      labels.set(record.ref, { title: record.title, type: record.type });
    }
  }

  return (ref) => labels.get(ref) ?? null;
}
