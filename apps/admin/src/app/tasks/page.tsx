import Link from "next/link";

import { getLlmTasks, type LlmTaskRecord } from "@portfolio/db/llm-tasks";

import { EmptyPanel } from "@/components/empty-panel";
import { LlmTaskAutoStarter } from "@/components/llm-task-auto-starter";
import { PageTitle } from "@/components/page-title";
import { TasksAutoRefresh } from "@/components/tasks-auto-refresh";

export const dynamic = "force-dynamic";

export default async function LlmTasksPage() {
  const { tasks, error } = await readTasks();
  const pendingCount = tasks.filter((task) => task.status === "pending").length;
  const runningCount = tasks.filter((task) => task.status === "running").length;
  const failedCount = tasks.filter((task) => task.status === "failed").length;
  const succeededCount = tasks.filter((task) => task.status === "succeeded").length;

  return (
    <main className="px-5 py-8 lg:px-8">
      <LlmTaskAutoStarter enabled={pendingCount > 0} />
      <TasksAutoRefresh enabled={runningCount > 0} />
      <PageTitle
        title="LLM Tasks"
        description="Trace LLM requests from Admin features. Prompt payloads, provider metadata, raw responses, and parse errors are stored here for debugging."
      />

      {error ? (
        <EmptyPanel
          title="Task log unavailable"
          description="The LLM task table could not be read. Apply the latest database migration, then reload this page."
        />
      ) : tasks.length === 0 ? (
        <EmptyPanel
          title="No LLM tasks yet"
          description="Run a task-backed AI workflow to create the first trace. Empty portfolio data will not call the LLM or create a task."
        />
      ) : (
        <div className="grid gap-5">
          <section className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Pending" value={pendingCount} tone="default" />
            <MetricCard label="Running" value={runningCount} tone="violet" />
            <MetricCard label="Succeeded" value={succeededCount} tone="default" />
            <MetricCard label="Failed" value={failedCount} tone="rose" />
          </section>

          <section className="grid gap-3">
            {tasks.map((task) => (
              <article key={task.id} className="ui-card p-5 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-ink">{task.title}</h2>
                      <StatusBadge status={task.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {task.taskType.replace(/_/g, " ")} started {formatDate(task.createdAt)}
                    </p>
                  </div>
                  <Link className="ui-btn-outline" href={`/tasks/${task.id}`}>
                    View trace
                  </Link>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-5">
                  <Detail label="Provider" value={task.providerName ?? "Not selected yet"} />
                  <Detail label="Model" value={task.providerModel ?? "Not selected yet"} />
                  <Detail label="Finish reason" value={task.finishReason ?? "Not available"} />
                  <Detail label="Duration" value={formatDuration(task.durationMs)} />
                  <Detail label="Error stage" value={task.errorStage ?? "None"} />
                </div>

                {task.errorMessage ? (
                  <p className="mt-4 rounded-lg border border-danger-300/30 bg-danger-500/10 px-3 py-2 text-sm leading-6 text-danger-100">
                    {task.errorMessage}
                  </p>
                ) : null}
              </article>
            ))}
          </section>
        </div>
      )}
    </main>
  );
}

async function readTasks(): Promise<{ tasks: LlmTaskRecord[]; error: boolean }> {
  try {
    return { tasks: await getLlmTasks(), error: false };
  } catch {
    return { tasks: [], error: true };
  }
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "rose" | "violet";
}) {
  const valueClass =
    tone === "rose" ? "text-danger-100" : tone === "violet" ? "text-accent-200" : "text-ink";

  return (
    <div className="ui-card p-5 shadow-card">
      <p className={`text-3xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
      <p className="mt-2 text-sm text-muted">{label}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-white/[0.02] p-3">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: LlmTaskRecord["status"] }) {
  const tone =
    status === "succeeded"
      ? "ui-badge-success"
      : status === "failed"
        ? "ui-badge-danger"
        : "ui-badge-warning";

  return <span className={`ui-badge capitalize ${tone}`}>{status}</span>;
}

function formatDate(value: Date): string {
  return value.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(value: number | null): string {
  if (value === null) {
    return "In progress";
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}s`;
  }

  return `${value}ms`;
}
