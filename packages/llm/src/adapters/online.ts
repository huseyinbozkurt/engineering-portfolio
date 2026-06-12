import { AnthropicAdapter } from "./anthropic-adapter";
import { joinUrl, LlmHttpError, timedFetch } from "./http";
import { OpenAiCompatibleAdapter } from "./openai-compatible-adapter";
import type { LLMAdapter, LLMProvider } from "./types";

type BuiltInProvider = Extract<LLMProvider, "openai" | "anthropic" | "deepseek">;
export type LlmConnectionProvider = BuiltInProvider | "custom";
type LlmStatus = "online" | "offline";

export interface LlmConnectionConfig {
  id: string;
  name: string;
  provider: LlmConnectionProvider;
  baseUrl: string;
  statusUrl: string;
  apiKey: string | null;
  model: string | null;
  requiresApiKey: boolean;
}

export interface LlmConnectionStatus {
  id: string;
  name: string;
  provider: LlmConnectionProvider;
  model: string | null;
  baseUrl: string;
  status: LlmStatus;
  message: string;
  checkedAt: Date;
}

export interface ResolvedLlmAdapter {
  adapter: LLMAdapter;
  connection: LlmConnectionConfig;
}

const providerDefaults: Record<
  BuiltInProvider,
  { name: string; baseUrl: string; model: string; apiKeyEnv: string }
> = {
  openai: {
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    apiKeyEnv: "OPENAI_API_KEY",
  },
  anthropic: {
    name: "Anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    model: "claude-3-5-sonnet-latest",
    apiKeyEnv: "ANTHROPIC_API_KEY",
  },
  deepseek: {
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    apiKeyEnv: "DEEPSEEK_API_KEY",
  },
};

const defaultStatusTimeoutMs = 5000;
const defaultGenerationTimeoutMs = 900000;
const defaultMaxTokens = 12000;
/** Generation requests never run with less than 15 minutes, regardless of env. */
const minimumGenerationTimeoutMs = 900000;

export function getLlmConnectionConfigs(): LlmConnectionConfig[] {
  return [...getBuiltInProviderConfigs(), ...getCustomProviderConfigs()];
}

export async function getLlmConnectionStatuses(): Promise<LlmConnectionStatus[]> {
  const configs = getLlmConnectionConfigs();

  return Promise.all(configs.map(checkLlmConnection));
}

export async function hasOnlineLlmConnection(): Promise<boolean> {
  return (await resolveOnlineLlmAdapter()) !== null;
}

/**
 * Maps the first online LLM connection onto a provider adapter. This is shared
 * by Admin actions and background task runners so UI availability and execution
 * choose providers with the same rules.
 */
export async function resolveOnlineLlmAdapter(): Promise<ResolvedLlmAdapter | null> {
  const [statuses, configs] = await Promise.all([
    getLlmConnectionStatuses(),
    Promise.resolve(getLlmConnectionConfigs()),
  ]);

  const online = statuses.find((status) => status.status === "online");
  if (!online) {
    return null;
  }

  const connection = configs.find((candidate) => candidate.id === online.id);
  if (!connection?.model) {
    return null;
  }

  const timeoutMs = Math.max(
    positiveNumber(process.env.LLM_ANALYSIS_TIMEOUT_MS) ?? defaultGenerationTimeoutMs,
    minimumGenerationTimeoutMs,
  );
  const maxTokens = positiveNumber(process.env.LLM_ANALYSIS_MAX_TOKENS) ?? defaultMaxTokens;

  if (connection.provider === "anthropic") {
    if (!connection.apiKey) {
      return null;
    }

    return {
      connection,
      adapter: new AnthropicAdapter({
        baseUrl: connection.baseUrl,
        apiKey: connection.apiKey,
        model: connection.model,
        timeoutMs,
        maxTokens,
      }),
    };
  }

  return {
    connection,
    adapter: new OpenAiCompatibleAdapter({
      provider:
        connection.provider === "openai" || connection.provider === "deepseek"
          ? connection.provider
          : "custom",
      baseUrl: connection.baseUrl,
      apiKey: connection.apiKey,
      model: connection.model,
      timeoutMs,
      maxTokens,
      // Local/custom servers sometimes reject response_format; hosted ones use it.
      jsonResponseFormat: connection.provider !== "custom",
    }),
  };
}

function getBuiltInProviderConfigs(): LlmConnectionConfig[] {
  return getEnabledBuiltInProviders().map((provider) => {
    const defaults = providerDefaults[provider];
    const prefix = provider.toUpperCase();
    const baseUrl = env(`${prefix}_BASE_URL`) ?? defaults.baseUrl;
    const statusUrl = env(`${prefix}_STATUS_URL`) ?? joinUrl(baseUrl, "models");
    const apiKey = env(defaults.apiKeyEnv);

    return {
      id: provider,
      name: env(`${prefix}_NAME`) ?? defaults.name,
      provider,
      baseUrl,
      statusUrl,
      apiKey,
      model: env(`${prefix}_MODEL`) ?? defaults.model,
      requiresApiKey: true,
    };
  });
}

function getEnabledBuiltInProviders(): BuiltInProvider[] {
  const configured = splitCsv(env("LLM_PROVIDERS")).filter(isBuiltInProvider);

  if (configured.length > 0) {
    return configured;
  }

  return (Object.keys(providerDefaults) as BuiltInProvider[]).filter((provider) => {
    const defaults = providerDefaults[provider];
    const prefix = provider.toUpperCase();

    return Boolean(
      env(defaults.apiKeyEnv) || env(`${prefix}_BASE_URL`) || env(`${prefix}_STATUS_URL`),
    );
  });
}

function getCustomProviderConfigs(): LlmConnectionConfig[] {
  return [...getJsonCustomProviderConfigs(), ...getSingleCustomProviderConfig()];
}

function getJsonCustomProviderConfigs(): LlmConnectionConfig[] {
  const raw = env("CUSTOM_LLM_CONNECTIONS");

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((value) => normalizeCustomProvider(value));
  } catch {
    return [];
  }
}

function getSingleCustomProviderConfig(): LlmConnectionConfig[] {
  const baseUrl = env("CUSTOM_LLM_BASE_URL");

  if (!baseUrl) {
    return [];
  }

  return [
    {
      id: env("CUSTOM_LLM_ID") ?? "custom",
      name: env("CUSTOM_LLM_NAME") ?? "Custom LLM",
      provider: "custom",
      baseUrl,
      statusUrl: env("CUSTOM_LLM_STATUS_URL") ?? joinUrl(baseUrl, "models"),
      apiKey: env("CUSTOM_LLM_API_KEY"),
      model: env("CUSTOM_LLM_MODEL"),
      requiresApiKey: false,
    },
  ];
}

function normalizeCustomProvider(value: unknown): LlmConnectionConfig[] {
  if (!isRecord(value)) {
    return [];
  }

  const id = stringValue(value.id);
  const baseUrl = stringValue(value.baseUrl);

  if (!id || !baseUrl || value.enabled === false) {
    return [];
  }

  const provider = isLlmConnectionProvider(value.provider) ? value.provider : "custom";
  const apiKeyEnv = stringValue(value.apiKeyEnv);
  const apiKey = stringValue(value.apiKey) ?? (apiKeyEnv ? env(apiKeyEnv) : null);
  const statusUrl = stringValue(value.statusUrl) ?? joinUrl(baseUrl, "models");

  return [
    {
      id,
      name: stringValue(value.name) ?? id,
      provider,
      baseUrl,
      statusUrl,
      apiKey,
      model: stringValue(value.model),
      requiresApiKey: provider !== "custom",
    },
  ];
}

async function checkLlmConnection(config: LlmConnectionConfig): Promise<LlmConnectionStatus> {
  const checkedAt = new Date();

  if (!config.baseUrl) {
    return offline(config, "Base URL is not configured.", checkedAt);
  }

  if (config.requiresApiKey && !config.apiKey) {
    return offline(config, "API key is not configured.", checkedAt);
  }

  try {
    await timedFetch(
      config.statusUrl,
      {
        method: "GET",
        headers: requestHeaders(config),
      },
      getStatusTimeoutMs(),
    );

    return {
      id: config.id,
      name: config.name,
      provider: config.provider,
      model: config.model,
      baseUrl: safeUrlLabel(config.baseUrl),
      status: "online",
      message: "Connection check succeeded.",
      checkedAt,
    };
  } catch (error) {
    return offline(config, statusErrorMessage(error), checkedAt);
  }
}

function requestHeaders(config: LlmConnectionConfig): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (!config.apiKey) {
    return headers;
  }

  if (config.provider === "anthropic") {
    headers["x-api-key"] = config.apiKey;
    headers["anthropic-version"] = process.env.ANTHROPIC_API_VERSION ?? "2023-06-01";
  } else {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }

  return headers;
}

function offline(
  config: LlmConnectionConfig,
  message: string,
  checkedAt: Date,
): LlmConnectionStatus {
  return {
    id: config.id,
    name: config.name,
    provider: config.provider,
    model: config.model,
    baseUrl: safeUrlLabel(config.baseUrl),
    status: "offline",
    message,
    checkedAt,
  };
}

function statusErrorMessage(error: unknown): string {
  if (error instanceof LlmHttpError) {
    if (error.timedOut) {
      return "Connection check timed out.";
    }

    if (error.status !== null) {
      return `Connection check returned HTTP ${error.status}.`;
    }
  }

  return "Connection check failed.";
}

function getStatusTimeoutMs(): number {
  return positiveNumber(process.env.LLM_STATUS_TIMEOUT_MS) ?? defaultStatusTimeoutMs;
}

function env(key: string): string | null {
  const value = process.env[key]?.trim();

  return value ? value : null;
}

function splitCsv(value: string | null): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);
}

function isBuiltInProvider(value: string): value is BuiltInProvider {
  return ["openai", "anthropic", "deepseek"].includes(value);
}

function isLlmConnectionProvider(value: unknown): value is LlmConnectionProvider {
  return typeof value === "string" && ["openai", "anthropic", "deepseek", "custom"].includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringValue(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function positiveNumber(value: string | undefined): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function safeUrlLabel(url: string): string {
  try {
    const parsed = new URL(url);

    if (parsed.password) parsed.password = "****";
    if (parsed.username) parsed.username = "****";

    return parsed.toString();
  } catch {
    return url;
  }
}
