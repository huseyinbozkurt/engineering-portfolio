"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { generateAiInsightsAction } from "@/app/ai-insights/actions";
import { AiInsightsReportView } from "@/components/ai-insights-report";
import type { AiInsightsActionState } from "@/lib/ai-insights/types";

interface AiInsightsRunnerProps {
  canGenerate: boolean;
  disabledReason: string | null;
  activeTask: {
    id: string;
    startedAt: string;
    providerName: string | null;
    providerModel: string | null;
  } | null;
  latestReport: AiInsightsActionState["report"];
  latestReportTaskId: string | null;
}

const initialState: AiInsightsActionState = {
  status: "idle",
  message: "",
  report: null,
  taskId: null,
};

export function AiInsightsRunner({
  canGenerate,
  disabledReason,
  activeTask,
  latestReport,
  latestReportTaskId,
}: AiInsightsRunnerProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(generateAiInsightsAction, initialState);
  const report = state.report ?? latestReport;

  useEffect(() => {
    if (!state.taskId) {
      return;
    }

    router.refresh();
  }, [router, state.taskId]);

  return (
    <section className="mt-8 grid gap-5">
      <div className="rounded-lg border border-line bg-white/[0.03] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">Run read-only AI evaluation</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              The LLM receives a bounded snapshot of existing portfolio records and returns
              structured insights. It cannot create, edit, seed, or overwrite data.
            </p>
          </div>
          <form action={formAction}>
            <button
              className="rounded-lg bg-teal-200 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canGenerate || isPending}
              type="submit"
            >
              {isPending ? "Starting..." : "Generate insights"}
            </button>
          </form>
        </div>
        {disabledReason ? (
          <p className="mt-4 rounded-lg border border-amber-200/30 bg-amber-200/10 px-3 py-2 text-sm text-amber-100">
            {disabledReason}
          </p>
        ) : null}
        {state.message ? (
          <div
            className={
              state.status === "success"
                ? "mt-4 rounded-lg border border-teal-300/30 bg-teal-300/10 px-3 py-2 text-sm text-teal-100"
                : "mt-4 rounded-lg border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100"
            }
            role="status"
          >
            <p>{state.message}</p>
            {state.taskId ? (
              <Link
                className="mt-2 inline-flex rounded-md border border-current/30 px-2 py-1 text-xs font-semibold transition hover:bg-white/10"
                href={`/tasks/${state.taskId}`}
              >
                Open task trace
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      {activeTask ? <RunningTaskCard task={activeTask} /> : null}
      {report ? (
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-white/[0.025] p-4">
            <div>
              <h2 className="text-lg font-semibold text-ink">Latest completed insight report</h2>
              <p className="mt-1 text-sm text-muted">
                Generated from the most recent successful AI Insights task.
              </p>
            </div>
            {latestReportTaskId ? (
              <Link
                className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:border-teal-300/50 hover:bg-white/[0.06]"
                href={`/tasks/${latestReportTaskId}`}
              >
                View source task
              </Link>
            ) : null}
          </div>
          <AiInsightsReportView report={report} />
        </div>
      ) : null}
    </section>
  );
}

function RunningTaskCard({
  task,
}: {
  task: {
    id: string;
    startedAt: string;
    providerName: string | null;
    providerModel: string | null;
  };
}) {
  return (
    <div className="rounded-lg border border-teal-300/30 bg-teal-300/10 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-teal-100">AI Insights task is running</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-teal-100/80">
            The LLM analysis is running in the background. You can keep using the admin while the
            task page captures provider selection, prompts, raw response, and any parse errors.
          </p>
        </div>
        <Link
          className="rounded-lg border border-teal-100/30 px-3 py-1.5 text-sm font-semibold text-teal-100 transition hover:bg-white/10"
          href={`/tasks/${task.id}`}
        >
          Open task trace
        </Link>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <TaskDetail label="Started" value={formatStartedAt(task.startedAt)} />
        <TaskDetail label="Provider" value={task.providerName ?? "Selecting provider"} />
        <TaskDetail label="Model" value={task.providerModel ?? "Selecting model"} />
      </div>
    </div>
  );
}

function TaskDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-teal-100/20 bg-black/10 p-3">
      <p className="text-xs uppercase tracking-wide text-teal-100/70">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-teal-50">{value}</p>
    </div>
  );
}

function formatStartedAt(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
