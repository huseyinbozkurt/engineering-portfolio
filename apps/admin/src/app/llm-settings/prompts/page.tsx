import Link from "next/link";

import { getLlmPromptVersions } from "@portfolio/db/llm-prompt-versions";
import {
  CONTENT_REVIEW_TARGET_TYPE_LABELS,
  isContentReviewTargetType,
  LLM_WORKFLOW_LABELS,
  LLM_WORKFLOWS,
  type LlmWorkflow,
} from "@portfolio/validators";

import { PageTitle } from "@/components/page-title";
import { formatDate } from "@/lib/format";
import {
  deletePromptVersionAction,
  duplicatePromptVersionAction,
  setPromptVersionActiveAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function PromptVersionsPage() {
  const versions = await getLlmPromptVersions();
  const byWorkflow = new Map<LlmWorkflow, typeof versions>();
  for (const workflow of LLM_WORKFLOWS) {
    byWorkflow.set(
      workflow,
      versions.filter((version) => version.workflow === workflow),
    );
  }

  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title="Prompt Versions"
        description="DB-managed prompts per workflow. Each workflow requires an active prompt before it can run. Prompt versions are admin-only and never shown in the public site."
        actions={
          <Link className="ui-btn-primary" href="/llm-settings/prompts/new">
            New version
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
                  {hasActive ? "Active DB prompt" : "No active prompt"}
                </span>
              </div>

              {rows.length === 0 ? (
                <p className="text-sm text-muted">
                  No prompt versions yet — this workflow cannot run until one is created and activated.
                </p>
              ) : (
                <ul className="grid gap-2">
                  {rows.map((row) => (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white/[0.02] px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                          {row.name}
                          {isContentReviewTargetType(row.targetType) ? (
                            <span className="ui-badge-neutral">
                              {CONTENT_REVIEW_TARGET_TYPE_LABELS[row.targetType]}
                            </span>
                          ) : null}
                          <span className="ui-chip">{row.version}</span>
                          {row.isActive ? <span className="ui-badge-success">Active</span> : null}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          Updated {formatDate(row.updatedAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link className="ui-btn-ghost" href={`/llm-settings/prompts/${row.id}`}>
                          Edit
                        </Link>
                        <form action={setPromptVersionActiveAction}>
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="isActive" value={row.isActive ? "false" : "true"} />
                          <button type="submit" className="ui-btn-outline">
                            {row.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </form>
                        <form action={duplicatePromptVersionAction}>
                          <input type="hidden" name="id" value={row.id} />
                          <button type="submit" className="ui-btn-ghost">
                            Duplicate
                          </button>
                        </form>
                        <form action={deletePromptVersionAction}>
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
