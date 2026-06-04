import Link from "next/link";

import { getLlmTasks, type LlmTaskRecord } from "@portfolio/db/llm-tasks";

import { EmptyPanel } from "@/components/empty-panel";
import { PageTitle } from "@/components/page-title";
import { TasksAutoRefresh } from "@/components/tasks-auto-refresh";

export const dynamic = "force-dynamic";

export default async function LlmTasksPage() {
  const { tasks, error } = await readTasks();
  const runningCount = tasks.filter((task) => task.status === "running").length;
  const failedCount = tasks.filter((task) => task.status === "failed").length;
  const succeededCount = tasks.filter((task) => task.status === "succeeded").length;

  return (
    <main className="px-5 py-8 lg:px-8">
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
          description="Run AI Insights to create the first task trace. Empty portfolio data will not call the LLM or create a task."
        />
      ) : (
        <div className="grid gap-5">
          <section className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Running" value={runningCount} tone="teal" />
            <MetricCard label="Succeeded" value={succeededCount} tone="default" />
            <MetricCard label="Failed" value={failedCount} tone="rose" />
          </section>

          <section className="grid gap-3">
            {tasks.map((task) => (
              <article
                key={task.id}
                className="rounded-lg border border-line bg-white/[0.025] p-5"
              >
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
                  <Link
                    className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:border-teal-300/50 hover:bg-white/[0.06]"
                    href={`/tasks/${task.id}`}
                  >
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
                  <p className="mt-4 rounded-lg border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm leading-6 text-rose-100">
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
  tone: "default" | "rose" | "teal";
}) {
  const valueClass =
    tone === "rose" ? "text-rose-100" : tone === "teal" ? "text-teal-100" : "text-ink";

  return (
    <div className="rounded-lg border border-line bg-white/[0.03] p-5">
      <p className={`text-3xl font-semibold ${valueClass}`}>{value}</p>
      <p className="mt-2 text-sm text-muted">{label}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-white/[0.025] p-3">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: LlmTaskRecord["status"] }) {
  const className =
    status === "succeeded"
      ? "border-teal-300/30 bg-teal-300/10 text-teal-100"
      : status === "failed"
        ? "border-rose-300/30 bg-rose-500/10 text-rose-100"
        : "border-amber-200/30 bg-amber-200/10 text-amber-100";

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}>
      {status}
    </span>
  );
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
