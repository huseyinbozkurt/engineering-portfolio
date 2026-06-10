import type { LlmConnectionStatus } from "@/lib/llm-config";

interface LlmStatusPanelProps {
  statuses: LlmConnectionStatus[];
}

export function LlmStatusPanel({ statuses }: LlmStatusPanelProps) {
  const onlineCount = statuses.filter((status) => status.status === "online").length;

  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">LLM Connections</h2>
          <p className="mt-1 text-sm text-muted">
            Configured from environment variables. API keys are never shown in the UI.
          </p>
        </div>
        {statuses.length > 0 ? (
          <span className="ui-chip font-medium tabular-nums">
            {onlineCount}/{statuses.length} online
          </span>
        ) : null}
      </div>
      {statuses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white/[0.025] p-5">
          <h3 className="text-base font-semibold text-ink">No LLM providers configured</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            Add provider settings to `.env`, such as `LLM_PROVIDERS` and provider API keys, to
            enable connection checks.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {statuses.map((connection) => (
            <article key={connection.id} className="ui-card p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-ink">{connection.name}</h3>
                  <p className="mt-1 text-xs uppercase tracking-wide text-muted">
                    {connection.provider}
                  </p>
                </div>
                <StatusBadge status={connection.status} />
              </div>
              <dl className="mt-4 grid gap-2 text-xs text-muted">
                {connection.model ? (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-medium text-ink/80">Model</dt>
                    <dd className="truncate">{connection.model}</dd>
                  </div>
                ) : null}
                <div className="grid gap-1">
                  <dt className="font-medium text-ink/80">Base URL</dt>
                  <dd className="break-all">{connection.baseUrl}</dd>
                </div>
                <div className="grid gap-1">
                  <dt className="font-medium text-ink/80">Status</dt>
                  <dd>{connection.message}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="font-medium text-ink/80">Checked</dt>
                  <dd>{formatCheckedAt(connection.checkedAt)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: LlmConnectionStatus["status"] }) {
  const isOnline = status === "online";

  return (
    <span className={isOnline ? "ui-badge ui-badge-success" : "ui-badge ui-badge-danger"}>
      <span
        className={
          isOnline ? "size-1.5 rounded-full bg-success-400" : "size-1.5 rounded-full bg-danger-200"
        }
      />
      {isOnline ? "Online" : "Offline"}
    </span>
  );
}

function formatCheckedAt(value: Date): string {
  return value.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
