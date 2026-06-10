
/**
 * Logger interface for insight generation runs. Implementations can route events
 * to console, logs, metrics, or any other destination.
 */
export interface InsightLogger {
  event(name: string, payload?: unknown): void;
  error(stage: string, payload?: unknown): void;
}

/**
 * No-op logger for cases where logging is not needed (e.g., tests).
 */
export const silentInsightLogger: InsightLogger = {
  event() {},
  error() {},
};

/**
 * Console-backed logger that emits structured events to stderr with timestamps.
 */
export class ConsoleInsightLogger implements InsightLogger {
  private readonly prefix: string;

  constructor(prefix?: string) {
    this.prefix = prefix ? `[${prefix}] ` : "";
  }

  event(name: string, payload?: unknown): void {
    const now = new Date().toISOString();
    console.error(`${this.prefix}${now} [event:${name}]`, JSON.stringify(payload));
  }

  error(stage: string, payload?: unknown): void {
    const now = new Date().toISOString();
    console.error(`${this.prefix}${now} [error:${stage}]`, JSON.stringify(payload));
  }
}

/**
 * Creates a logger with the run ID as prefix for better traceability.
 */
export function createInsightLogger(runId: string | null) {
  return new ConsoleInsightLogger(runId ? `run-${runId.slice(0, 8)}` : "llm");
}
