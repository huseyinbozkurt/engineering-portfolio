import {
  getLlmConnectionConfigs,
  getLlmConnectionStatuses,
  type LlmConnectionConfig,
} from "@/lib/llm-config";

interface LlmJsonCallResult {
  content: string;
  finishReason: string | null;
  provider: {
    name: string;
    model: string | null;
  };
}

interface LlmCallCallbacks {
  onProviderSelected?: (provider: LlmJsonCallResult["provider"]) => Promise<void> | void;
}

const defaultAnalysisTimeoutMs = 90000;
const defaultAnalysisMaxTokens = 6000;
const analysisTimeoutMs =
  parsePositiveMilliseconds(process.env.LLM_ANALYSIS_TIMEOUT_MS) ?? defaultAnalysisTimeoutMs;
const analysisMaxTokens =
  parsePositiveInteger(process.env.LLM_ANALYSIS_MAX_TOKENS) ?? defaultAnalysisMaxTokens;

export async function callInsightsLlm({
  system,
  user,
  onProviderSelected,
}: {
  system: string;
  user: string;
} & LlmCallCallbacks): Promise<LlmJsonCallResult> {
  const [statuses, configs] = await Promise.all([
    getLlmConnectionStatuses(),
    Promise.resolve(getLlmConnectionConfigs()),
  ]);
  const onlineStatus = statuses.find((status) => status.status === "online");

  if (!onlineStatus) {
    throw new Error("No online LLM connection is available.");
  }

  const config = configs.find((candidate) => candidate.id === onlineStatus.id);

  if (!config) {
    throw new Error("Online LLM configuration could not be resolved.");
  }

  if (!config.model) {
    throw new Error(`${config.name} is online, but no model is configured.`);
  }

  const provider = {
    name: config.name,
    model: config.model,
  };

  await onProviderSelected?.(provider);

  const response =
    config.provider === "anthropic"
      ? await callAnthropic(config, system, user)
      : await callOpenAiCompatible(config, system, user);

  return {
    ...response,
    provider,
  };
}

async function callOpenAiCompatible(
  config: LlmConnectionConfig,
  system: string,
  user: string,
): Promise<{ content: string; finishReason: string | null }> {
  const response = await timedFetch(joinUrl(config.baseUrl, "chat/completions"), {
    method: "POST",
    headers: {
      ...authHeaders(config),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      max_tokens: analysisMaxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: config.provider === "custom" ? undefined : { type: "json_object" },
    }),
  });

  const payload = (await response.json()) as unknown;
  const content = readPath(payload, ["choices", 0, "message", "content"]);
  const finishReason = readPath(payload, ["choices", 0, "finish_reason"]);

  if (typeof content !== "string") {
    throw new Error("LLM response did not include message content.");
  }

  return {
    content,
    finishReason: typeof finishReason === "string" ? finishReason : null,
  };
}

async function callAnthropic(
  config: LlmConnectionConfig,
  system: string,
  user: string,
): Promise<{ content: string; finishReason: string | null }> {
  const response = await timedFetch(joinUrl(config.baseUrl, "messages"), {
    method: "POST",
    headers: {
      ...authHeaders(config),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: analysisMaxTokens,
      temperature: 0.2,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  const payload = (await response.json()) as unknown;
  const content = readPath(payload, ["content", 0, "text"]);
  const finishReason = readPath(payload, ["stop_reason"]);

  if (typeof content !== "string") {
    throw new Error("LLM response did not include text content.");
  }

  return {
    content,
    finishReason: typeof finishReason === "string" ? finishReason : null,
  };
}

async function timedFetch(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), analysisTimeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`LLM analysis request returned HTTP ${response.status}.`);
    }

    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        `LLM analysis timed out after ${formatTimeout(analysisTimeoutMs)}. Increase LLM_ANALYSIS_TIMEOUT_MS or use a faster model.`,
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function authHeaders(config: LlmConnectionConfig): Record<string, string> {
  if (!config.apiKey) {
    return {};
  }

  if (config.provider === "anthropic") {
    return {
      "x-api-key": config.apiKey,
      "anthropic-version": process.env.ANTHROPIC_API_VERSION ?? "2023-06-01",
    };
  }

  return {
    Authorization: `Bearer ${config.apiKey}`,
  };
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function formatTimeout(milliseconds: number): string {
  if (milliseconds >= 1000) {
    return `${Math.round(milliseconds / 1000)}s`;
  }

  return `${milliseconds}ms`;
}

function parsePositiveMilliseconds(value: string | undefined): number | null {
  const milliseconds = Number(value);

  if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
    return null;
  }

  return milliseconds;
}

function parsePositiveInteger(value: string | undefined): number | null {
  const integer = Number(value);

  if (!Number.isInteger(integer) || integer <= 0) {
    return null;
  }

  return integer;
}

function readPath(value: unknown, path: Array<string | number>): unknown {
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
