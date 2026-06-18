import Link from "next/link";
import { notFound } from "next/navigation";

import { getLlmRun, getLlmRunSuggestions } from "@portfolio/db/llm-runs";
import {
  LLM_WORKFLOW_LABELS,
  resolveVisibleModelName,
  type LlmWorkflow,
} from "@portfolio/validators";

import { PageTitle } from "@/components/page-title";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

interface LlmRunDetailPageProps {
  params: Promise<{ id: string }>;
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="ui-card p-5 shadow-card">
      <h2 className="ui-section-title mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Pre({ value }: { value: string }) {
  return (
    <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-black/30 p-4 text-xs leading-5 text-ink/80">
      {value || "—"}
    </pre>
  );
}

export default async function LlmRunDetailPage({ params }: LlmRunDetailPageProps) {
  const { id } = await params;
  const run = await getLlmRun(id);

  if (!run) {
    notFound();
  }

  const suggestions = await getLlmRunSuggestions({ runId: run.id });
  const visibleModel = resolveVisibleModelName({
    visibleModelName: run.visibleModelName,
    provider: run.provider,
    model: run.model,
  });

  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title={`${LLM_WORKFLOW_LABELS[run.workflow as LlmWorkflow] ?? run.workflow} run`}
        description={`${run.status} · ${visibleModel} · ${formatDate(run.createdAt)}`}
        actions={
          <Link className="ui-btn-secondary" href="/llm-runs">
            Back to runs
          </Link>
        }
      />

      <div className="grid gap-6">
        <Block title="Run details">
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="ui-label">Status</dt>
              <dd className="text-ink">{run.status}</dd>
            </div>
            <div>
              <dt className="ui-label">Model</dt>
              <dd className="text-ink">{visibleModel}</dd>
            </div>
            <div>
              <dt className="ui-label">Provider</dt>
              <dd className="text-ink">{run.provider ?? "—"}</dd>
            </div>
            <div>
              <dt className="ui-label">Prompt source</dt>
              <dd className="text-ink">{run.promptSource}</dd>
            </div>
            <div>
              <dt className="ui-label">Config source</dt>
              <dd className="text-ink">{run.configSource}</dd>
            </div>
            <div>
              <dt className="ui-label">Sampling</dt>
              <dd className="text-ink">
                temp {run.temperature ?? "—"} · topP {run.topP ?? "—"} · maxTokens{" "}
                {run.maxTokens ?? "—"} · retries {run.maxRetries ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="ui-label">Target</dt>
              <dd className="text-ink">
                {run.targetType ? `${run.targetType}${run.targetId ? ` · ${run.targetId}` : ""}` : "—"}
              </dd>
            </div>
            <div>
              <dt className="ui-label">Duration</dt>
              <dd className="text-ink">
                {run.durationMs != null ? `${(run.durationMs / 1000).toFixed(1)}s` : "—"}
              </dd>
            </div>
            <div>
              <dt className="ui-label">Token usage</dt>
              <dd className="text-ink">
                {run.tokenUsage?.totalTokens != null ? `${run.tokenUsage.totalTokens} total` : "—"}
              </dd>
            </div>
          </dl>
          {run.errorMessage ? (
            <p className="ui-error mt-4">
              {run.errorStage ? `[${run.errorStage}] ` : ""}
              {run.errorMessage}
            </p>
          ) : null}
        </Block>

        <Block title="Rendered system prompt">
          <Pre value={run.promptSystem} />
        </Block>
        <Block title="Rendered user prompt">
          <Pre value={run.promptUser} />
        </Block>

        {run.validationNotes && run.validationNotes.length > 0 ? (
          <Block title={`Validation notes (${run.validationNotes.length})`}>
            <ul className="grid gap-1 text-xs text-muted">
              {run.validationNotes.map((note, index) => (
                <li key={index} className="rounded-lg border border-line bg-white/[0.02] px-3 py-2">
                  {note}
                </li>
              ))}
            </ul>
          </Block>
        ) : null}

        <Block title={`Attempts (${run.attempts?.length ?? 0})`}>
          {run.attempts && run.attempts.length > 0 ? (
            <ul className="grid gap-1.5 text-xs text-muted">
              {run.attempts.map((attempt) => (
                <li
                  key={attempt.attemptNo}
                  className="rounded-lg border border-line bg-white/[0.02] px-3 py-2"
                >
                  #{attempt.attemptNo} ·{" "}
                  {attempt.errorMessage ? (
                    <span className="text-danger-200">
                      {attempt.validationErrorStage ? `[${attempt.validationErrorStage}] ` : ""}
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
        </Block>

        <Block title="Parsed output JSON">
          <Pre value={run.outputJson ? JSON.stringify(run.outputJson, null, 2) : ""} />
        </Block>
        <Block title="Raw provider response">
          <Pre value={run.rawResponse ?? ""} />
        </Block>

        {suggestions.length > 0 ? (
          <Block title={`Review-only suggestions (${suggestions.length})`}>
            <p className="ui-hint mb-3">
              Suggestions are review-only. Approving or rejecting records a decision and never
              modifies live portfolio data.
            </p>
            <ul className="grid gap-2 text-sm">
              {suggestions.map((suggestion) => (
                <li
                  key={suggestion.id}
                  className="rounded-xl border border-line bg-white/[0.02] px-4 py-3"
                >
                  <p className="flex items-center gap-2 font-medium text-ink">
                    <span className="ui-chip">{suggestion.action}</span>
                    {suggestion.targetGroup ?? suggestion.suggestionType}
                    <span className="ui-badge-neutral">{suggestion.status}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted">{suggestion.reason}</p>
                </li>
              ))}
            </ul>
          </Block>
        ) : null}

        {/* Advanced metadata — admin-only; never shown in the public site. */}
        <details className="ui-card p-5 shadow-card">
          <summary className="ui-section-title cursor-pointer">Advanced metadata (debug)</summary>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="ui-label">Prompt version</dt>
              <dd className="text-ink">
                {run.promptVersion ? `${run.promptName ?? ""} (${run.promptVersion})` : "Legacy prompt"}
              </dd>
            </div>
            <div>
              <dt className="ui-label">Prompt version id</dt>
              <dd className="break-anywhere text-ink">{run.promptVersionId ?? "—"}</dd>
            </div>
            <div>
              <dt className="ui-label">Configuration id</dt>
              <dd className="break-anywhere text-ink">{run.llmConfigurationId ?? "—"}</dd>
            </div>
            <div>
              <dt className="ui-label">Run id</dt>
              <dd className="break-anywhere text-ink">{run.id}</dd>
            </div>
          </dl>
        </details>
      </div>
    </main>
  );
}
