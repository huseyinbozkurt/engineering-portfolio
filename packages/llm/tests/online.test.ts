import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setLlmFetchForTesting } from "../src/adapters/http";
import {
  getLlmConnectionStatuses,
  hasOnlineLlmConnection,
  resolveOnlineLlmAdapter,
} from "../src/adapters/online";

const envKeys = [
  "LLM_PROVIDERS",
  "LLM_STATUS_TIMEOUT_MS",
  "LLM_ANALYSIS_TIMEOUT_MS",
  "LLM_ANALYSIS_MAX_TOKENS",
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
  "OPENAI_STATUS_URL",
  "OPENAI_MODEL",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_BASE_URL",
  "ANTHROPIC_STATUS_URL",
  "ANTHROPIC_MODEL",
  "DEEPSEEK_API_KEY",
  "DEEPSEEK_BASE_URL",
  "DEEPSEEK_STATUS_URL",
  "DEEPSEEK_MODEL",
  "CUSTOM_LLM_CONNECTIONS",
  "CUSTOM_LLM_BASE_URL",
  "CUSTOM_LLM_STATUS_URL",
  "CUSTOM_LLM_API_KEY",
  "CUSTOM_LLM_MODEL",
] as const;

const originalEnv = new Map<string, string | undefined>();

beforeEach(() => {
  for (const key of envKeys) {
    originalEnv.set(key, process.env[key]);
    delete process.env[key];
  }
});

afterEach(() => {
  setLlmFetchForTesting(null);
  for (const key of envKeys) {
    const original = originalEnv.get(key);
    if (original === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  }
  originalEnv.clear();
});

describe("online LLM resolver", () => {
  it("returns no online adapter when no provider is configured", async () => {
    await expect(getLlmConnectionStatuses()).resolves.toEqual([]);
    await expect(resolveOnlineLlmAdapter()).resolves.toBeNull();
  });

  it("marks configured hosted providers offline when the API key is missing", async () => {
    process.env.LLM_PROVIDERS = "openai";
    const fetchMock = vi.fn();
    setLlmFetchForTesting(fetchMock);

    const statuses = await getLlmConnectionStatuses();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(statuses).toMatchObject([
      {
        id: "openai",
        status: "offline",
        message: "API key is not configured.",
      },
    ]);
  });

  it("resolves the first online custom provider as an executable adapter", async () => {
    process.env.CUSTOM_LLM_BASE_URL = "http://127.0.0.1:11434/v1";
    process.env.CUSTOM_LLM_MODEL = "qwen-test";
    setLlmFetchForTesting(
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 })),
    );

    const statuses = await getLlmConnectionStatuses();
    const resolved = await resolveOnlineLlmAdapter();

    expect(statuses).toMatchObject([
      {
        id: "custom",
        status: "online",
        model: "qwen-test",
      },
    ]);
    expect(resolved?.adapter.getProvider()).toBe("custom");
    expect(resolved?.adapter.getModel()).toBe("qwen-test");
  });

  it("does not treat an online custom endpoint without a model as usable", async () => {
    process.env.CUSTOM_LLM_BASE_URL = "http://127.0.0.1:11434/v1";
    setLlmFetchForTesting(
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 })),
    );

    await expect(getLlmConnectionStatuses()).resolves.toMatchObject([
      {
        id: "custom",
        status: "online",
        model: null,
      },
    ]);
    await expect(hasOnlineLlmConnection()).resolves.toBe(false);
    await expect(resolveOnlineLlmAdapter()).resolves.toBeNull();
  });
});
