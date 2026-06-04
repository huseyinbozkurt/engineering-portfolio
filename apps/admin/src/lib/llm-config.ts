type BuiltInProvider = "openai" | "anthropic" | "deepseek";
export type LlmProvider = BuiltInProvider | "custom";
type LlmStatus = "online" | "offline";

export interface LlmConnectionConfig {
  id: string;
  name: string;
  provider: LlmProvider;
  baseUrl: string;
  statusUrl: string;
  apiKey: string | null;
  model: string | null;
  requiresApiKey: boolean;
}

export interface LlmConnectionStatus {
  id: string;
  name: string;
  provider: LlmProvider;
  model: string | null;
  baseUrl: string;
  status: LlmStatus;
  message: string;
  checkedAt: Date;
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

const configuredStatusTimeoutMs = Number(process.env.LLM_STATUS_TIMEOUT_MS);
const statusTimeoutMs = Number.isFinite(configuredStatusTimeoutMs)
  ? configuredStatusTimeoutMs
  : 3000;

export async function getLlmConnectionStatuses(): Promise<LlmConnectionStatus[]> {
  const configs = getLlmConnectionConfigs();

  return Promise.all(configs.map(checkLlmConnection));
}

export function getLlmConnectionConfigs(): LlmConnectionConfig[] {
  return [...getBuiltInProviderConfigs(), ...getCustomProviderConfigs()];
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

  const provider = isLlmProvider(value.provider) ? value.provider : "custom";
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), statusTimeoutMs);

  try {
    const response = await fetch(config.statusUrl, {
      cache: "no-store",
      headers: requestHeaders(config),
      signal: controller.signal,
    });

    if (response.ok) {
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
    }

    return offline(config, `Connection check returned HTTP ${response.status}.`, checkedAt);
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Connection check timed out."
        : "Connection check failed.";

    return offline(config, message, checkedAt);
  } finally {
    clearTimeout(timeout);
  }
}

function requestHeaders(config: LlmConnectionConfig): HeadersInit {
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

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function safeUrlLabel(value: string): string {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return value;
  }
}

function env(key: string): string | null {
  const value = process.env[key]?.trim();
  return value ? value : null;
}

function splitCsv(value: string | null): string[] {
  return value
    ? value
        .split(",")
        .map((part) => part.trim().toLowerCase())
        .filter(Boolean)
    : [];
}

function isBuiltInProvider(value: string): value is BuiltInProvider {
  return value === "openai" || value === "anthropic" || value === "deepseek";
}

function isLlmProvider(value: unknown): value is LlmProvider {
  return (
    typeof value === "string" &&
    (value === "openai" || value === "anthropic" || value === "deepseek" || value === "custom")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}
