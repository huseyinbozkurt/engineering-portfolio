/**
 * Structured, low-noise logging for the LLM task lifecycle. Logs identifiers
 * and counters only — never full prompt/response content — so worker output is
 * safe to ship. One line per event, grep-friendly `key=value` pairs.
 */
export type LlmTaskLogEvent =
  | "created"
  | "skipped"
  | "claimed"
  | "started"
  | "completed"
  | "failed"
  | "recovered"
  | "bulk_queued";

export interface LlmTaskLogFields {
  id?: string | null;
  taskType?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  attempts?: number | null;
  status?: string | null;
  detail?: string | null;
}

export function logLlmTaskEvent(event: LlmTaskLogEvent, fields: LlmTaskLogFields = {}): void {
  const parts = [
    `event=${event}`,
    fields.id ? `task=${fields.id}` : null,
    fields.taskType ? `type=${fields.taskType}` : null,
    fields.targetType ? `content_type=${fields.targetType}` : null,
    fields.targetId ? `content_id=${fields.targetId}` : null,
    typeof fields.attempts === "number" ? `attempt=${fields.attempts}` : null,
    fields.status ? `status=${fields.status}` : null,
    fields.detail ? `detail=${fields.detail}` : null,
  ].filter(Boolean);

  console.log(`[llm-task] ${parts.join(" ")}`);
}
