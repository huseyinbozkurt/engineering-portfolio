import Link from "next/link";

import { getLlmConfigurations } from "@portfolio/db/llm-configurations";
import {
  LLM_WORKFLOW_LABELS,
  LLM_WORKFLOWS,
  resolveVisibleModelName,
  type LlmWorkflow,
} from "@portfolio/validators";

import { PageTitle } from "@/components/page-title";
import { formatDate } from "@/lib/format";
import {
  deleteLlmConfigurationAction,
  duplicateLlmConfigurationAction,
  setLlmConfigurationActiveAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function LlmConfigurationsPage() {
  const configs = await getLlmConfigurations();
  const byWorkflow = new Map<LlmWorkflow, typeof configs>();
  for (const workflow of LLM_WORKFLOWS) {
    byWorkflow.set(
      workflow,
      configs.filter((config) => config.workflow === workflow),
    );
  }

  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title="LLM Configurations"
        description="DB-managed provider/model/sampling settings per workflow. When no config is active, the workflow falls back to the .env configuration."
        actions={
          <Link className="ui-btn-primary" href="/llm-settings/configurations/new">
            New configuration
          </Link>
        }
      />

      <div className="grid gap-6">
        {LLM_WORKFLOWS.map((workflow) => {
          const rows = byWorkflow.get(workflow) ?? [];
          const hasActive = rows.some((row) => row.isActive);
          return (
            <section key={workflow} className="ui-card p-5 shadow-card">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="ui-section-title">{LLM_WORKFLOW_LABELS[workflow]}</h2>
                <span className={hasActive ? "ui-badge-success" : "ui-badge-warning"}>
                  {hasActive ? "Active DB config" : ".env fallback"}
                </span>
              </div>

              {rows.length === 0 ? (
                <p className="text-sm text-muted">
                  No configurations yet — this workflow uses the .env configuration.
                </p>
              ) : (
                <ul className="grid gap-2">
                  {rows.map((row) => (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white/[0.02] px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-sm font-medium text-ink">
                          {resolveVisibleModelName({
                            visibleModelName: row.visibleModelName,
                            provider: row.provider,
                            model: row.model,
                          })}
                          {row.isActive ? <span className="ui-badge-success">Active</span> : null}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {row.provider} · temp {row.temperature} · topP {row.topP} · maxTokens{" "}
                          {row.maxTokens} · retries {row.maxRetries} · updated{" "}
                          {formatDate(row.updatedAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link className="ui-btn-ghost" href={`/llm-settings/configurations/${row.id}`}>
                          Edit
                        </Link>
                        <form action={setLlmConfigurationActiveAction}>
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="isActive" value={row.isActive ? "false" : "true"} />
                          <button type="submit" className="ui-btn-outline">
                            {row.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </form>
                        <form action={duplicateLlmConfigurationAction}>
                          <input type="hidden" name="id" value={row.id} />
                          <button type="submit" className="ui-btn-ghost">
                            Duplicate
                          </button>
                        </form>
                        <form action={deleteLlmConfigurationAction}>
                          <input type="hidden" name="id" value={row.id} />
                          <button type="submit" className="ui-btn-danger">
                            Delete
                          </button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
