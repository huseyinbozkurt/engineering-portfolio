/** Shared HTTP helpers for the real provider adapters. */

export class LlmHttpError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly timedOut = false,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "LlmHttpError";
  }
}

/**
 * Node's built-in `fetch` enforces undici's `headersTimeout` of 300 000 ms
 * (5 minutes) regardless of any AbortController — slow local models that take
 * longer than that before the first response byte die with "fetch failed".
 * LLM calls therefore go through undici's own fetch with an Agent that has
 * headers/body timeouts DISABLED; the per-request AbortController in
 * {@link timedFetch} (driven by the adapter's `timeoutMs`, 15 min by default)
 * is the single timeout authority.
 */
type LlmFetch = (url: string, init: Record<string, unknown>) => Promise<Response>;

let fetchOverride: LlmFetch | null = null;
let llmFetchPromise: Promise<LlmFetch> | null = null;

/** Test seam: inject a fake fetch (pass null to restore the real transport). */
export function setLlmFetchForTesting(fetchLike: LlmFetch | null): void {
  fetchOverride = fetchLike;
}

function resolveLlmFetch(): Promise<LlmFetch> {
  if (fetchOverride) {
    return Promise.resolve(fetchOverride);
  }

  llmFetchPromise ??= import("undici")
    .then(({ fetch: undiciFetch, Agent }) => {
      const agent = new Agent({
        // Disabled on purpose — see module comment. Connection establishment
        // still uses undici's default connect timeout (~10s), which is right:
        // a dead server should fail fast, a slow generation should not.
        headersTimeout: 0,
        bodyTimeout: 0,
      });
      const wrapped: LlmFetch = async (url, init) =>
        (await undiciFetch(url, {
          ...init,
          dispatcher: agent,
        } as never)) as unknown as Response;
      return wrapped;
    })
    .catch(() => {
      // undici unavailable (unexpected on the server runtime) — fall back to
      // the built-in fetch and its 300s headers ceiling rather than crashing.
      const fallback: LlmFetch = (url, init) => fetch(url, init as RequestInit);
      return fallback;
    });

  return llmFetchPromise;
}

export async function timedFetch(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const llmFetch = await resolveLlmFetch();
    const response = await llmFetch(url, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      // Include the body in details for better error messages
      let bodyDetails;
      try {
        bodyDetails = await response.text();
      } catch (e) {
        bodyDetails = "(could not read body)";
      }
      throw new LlmHttpError(
        `LLM request returned HTTP ${response.status}.`,
        response.status,
        false,
        bodyDetails,
      );
    }

    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new LlmHttpError(
        `LLM request timed out after ${Math.round(timeoutMs / 1000)}s.`,
        null,
        true,
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export function readPath(value: unknown, path: Array<string | number>): unknown {
  let current = value;

  for (const segment of path) {
    if (typeof segment === "number") {
      if (!Array.isArray(current)) {
        return undefined;
      }
      current = current[segment];
      continue;
    }

    if (typeof current !== "object" || current === null || !(segment in current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

export function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
