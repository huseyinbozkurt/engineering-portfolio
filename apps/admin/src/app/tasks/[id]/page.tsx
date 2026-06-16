import Link from "next/link";
import { notFound } from "next/navigation";

import { getLlmTask, type LlmTaskRecord } from "@portfolio/db/llm-tasks";
import { getAiModelDisplayName } from "@portfolio/validators";

import { LlmTaskAutoStarter } from "@/components/llm-task-auto-starter";
import { PageTitle } from "@/components/page-title";
import { TasksAutoRefresh } from "@/components/tasks-auto-refresh";

export const dynamic = "force-dynamic";

interface LlmTaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LlmTaskDetailPage({ params }: LlmTaskDetailPageProps) {
  const { id } = await params;
  const task = await getLlmTask(id);

  if (!task) {
    notFound();
  }

  return (
    <main className="px-5 py-8 lg:px-8">
      <LlmTaskAutoStarter enabled={task.status === "pending"} />
      <TasksAutoRefresh enabled={task.status === "running"} />
      <Link href="/tasks" className="text-sm text-muted transition hover:text-ink">
        Back to LLM tasks
      </Link>
      <div className="mt-4">
        <PageTitle
          title={task.title}
          description="Full trace of the server-side prompt, provider selection, raw LLM response, and parse result for this task."
        />
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Detail label="Status" value={task.status} />
        <Detail label="Task type" value={task.taskType.replace(/_/g, " ")} />
        <Detail
          label="Model"
          value={getAiModelDisplayName({
            provider: task.providerName,
            model: task.providerModel,
          })}
        />
        <Detail label="Finish reason" value={task.finishReason ?? "Not available"} />
        <Detail label="Started" value={formatDate(task.startedAt ?? task.createdAt)} />
        <Detail label="Completed" value={task.completedAt ? formatDate(task.completedAt) : "Not completed"} />
        <Detail label="Duration" value={formatDuration(task.durationMs)} />
        <Detail label="Error stage" value={task.errorStage ?? "None"} />
      </section>

      <TaskTimeline task={task} />

      {task.errorMessage ? (
        <section className="mt-5 rounded-2xl border border-danger-300/30 bg-danger-500/10 p-4">
          <h2 className="text-sm font-semibold text-danger-100">Error</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-danger-100">
            {task.errorMessage}
          </p>
        </section>
      ) : null}

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <TraceBlock title="System prompt" content={task.promptSystem} />
        <TraceBlock title="User prompt" content={task.promptUser} />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <TraceBlock
          title="Raw LLM response"
          content={task.rawResponse ?? "No raw response captured yet."}
        />
        <TraceBlock
          title="Parsed response"
          content={formatParsedResponse(task.parsedResponse)}
        />
      </section>
    </main>
  );
}

function TaskTimeline({ task }: { task: LlmTaskRecord }) {
  const steps = [
    { label: "Task created", done: true },
    { label: "Model selected", done: Boolean(task.providerName || task.providerModel) },
    { label: "Raw response captured", done: Boolean(task.rawResponse) },
    {
      label: task.status === "failed" ? "Failed" : "Parsed",
      done: task.status === "succeeded" || task.status === "failed",
    },
  ];

  return (
    <section className="mt-5 ui-card p-5 shadow-card">
      <h2 className="text-base font-semibold text-ink">Trace timeline</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {steps.map((step) => (
          <div
            key={step.label}
            className={
              step.done
                ? "rounded-xl border border-success-400/30 bg-success-400/10 p-3 text-success-100"
                : "rounded-xl border border-line bg-white/[0.02] p-3 text-muted"
            }
          >
            <p className="text-sm font-medium">{step.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TraceBlock({ title, content }: { title: string; content: string }) {
  return (
    <section className="ui-card p-5 shadow-card">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <pre className="mt-4 max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-black/20 p-4 text-xs leading-5 text-muted">
        {content}
      </pre>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="ui-card p-4 shadow-card">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

function formatDate(value: Date): string {
  return value.toLocaleString("en-US", {
    year: "numeric",
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

function formatParsedResponse(value: unknown): string {
  if (value === null || value === undefined) {
    return "No parsed response captured.";
  }

  return JSON.stringify(value, null, 2);
}
