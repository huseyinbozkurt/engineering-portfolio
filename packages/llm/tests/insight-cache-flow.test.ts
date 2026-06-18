import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

// The DB layer is mocked so runLlmTask can be exercised without a database. Each
// factory returns plain vi.fn()s; behaviour is configured per test in beforeEach.
vi.mock("@portfolio/db/llm-runs", () => ({
  getActiveLlmRun: vi.fn(),
  getLatestSuccessfulInsightRunByIdentity: vi.fn(),
  createLlmRun: vi.fn(),
  updateLlmRun: vi.fn(),
  completeLlmRunWithSuggestions: vi.fn(),
}));
vi.mock("@portfolio/db/llm-prompt-versions", () => ({ getActivePromptVersion: vi.fn() }));
vi.mock("@portfolio/db/llm-configurations", () => ({ getActiveLlmConfiguration: vi.fn() }));
vi.mock("@portfolio/db/queries", () => ({ getPublishedInsightSource: vi.fn() }));
vi.mock("@portfolio/db/taxonomy-review", () => ({ getTaxonomyReviewSource: vi.fn() }));

import { getActiveLlmConfiguration } from "@portfolio/db/llm-configurations";
import { getActivePromptVersion } from "@portfolio/db/llm-prompt-versions";
import {
  createLlmRun,
  getActiveLlmRun,
  getLatestSuccessfulInsightRunByIdentity,
  updateLlmRun,
} from "@portfolio/db/llm-runs";
import { getPublishedInsightSource } from "@portfolio/db/queries";

import { runLlmTask } from "../src/services/llm-task-runner";
import { makeOutput, makeSource } from "./fixtures";

const generate = vi.fn();

/** A resolved adapter whose inner generate() is a spy we can assert against. */
function fakeAdapter() {
  return {
    adapter: {
      getProvider: () => "mock-provider",
      getModel: () => "mock-model",
      generate,
    },
  } as never;
}

/** A prior successful run with an output that passes current validation. */
function cachedRun() {
  return {
    id: "cached-run",
    outputJson: makeOutput(),
    completedAt: new Date(),
    createdAt: new Date(),
    promptVersion: "portfolio-insight-v5",
    model: "mock-model",
    visibleModelName: null,
  } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  (getActiveLlmRun as Mock).mockResolvedValue(null);
  // aiInsights requires an active DB prompt.
  (getActivePromptVersion as Mock).mockResolvedValue({
    id: "ver-active",
    version: "seed-v5",
    name: "Seed",
    systemPrompt: "System rules.",
    userPromptTemplate: "DATASET:\n{{dataset}}",
  });
  (getActiveLlmConfiguration as Mock).mockResolvedValue({
    id: "config-active",
    provider: "custom",
    model: "mock-model",
    visibleModelName: null,
    baseUrl: "http://llm.test/v1",
    temperature: 0.2,
    topP: 0.9,
    maxTokens: 4096,
    maxRetries: 1,
    timeoutMs: 900_000,
  });
  (getPublishedInsightSource as Mock).mockResolvedValue(makeSource());
  (getLatestSuccessfulInsightRunByIdentity as Mock).mockResolvedValue(null);
  (createLlmRun as Mock).mockImplementation(async (input: Record<string, unknown>) => ({
    id: "run-new",
    ...input,
  }));
  (updateLlmRun as Mock).mockImplementation(async (id: string, patch: Record<string, unknown>) => ({
    id,
    ...patch,
  }));
  generate.mockResolvedValue({
    text: JSON.stringify(makeOutput()),
    usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    finishReason: "stop",
  });
});

describe("runLlmTask aiInsights caching", () => {
  it("calls the LLM on a cache miss and records a non-cache run", async () => {
    const result = await runLlmTask(
      { workflow: "aiInsights", entityType: "portfolio" },
      { resolvedAdapter: fakeAdapter() },
    );

    expect(result.status).toBe("created");
    expect(result.cacheHit).toBeFalsy();
    expect((createLlmRun as Mock).mock.calls[0]?.[0]).toMatchObject({ cacheHit: false });
    // The run is fire-and-forget; the LLM is invoked on the next tick.
    await vi.waitFor(() => expect(generate).toHaveBeenCalledTimes(1));
  });

  it("serves the cached output on a hit WITHOUT calling the LLM", async () => {
    (getLatestSuccessfulInsightRunByIdentity as Mock).mockResolvedValue(cachedRun());

    const result = await runLlmTask(
      { workflow: "aiInsights", entityType: "portfolio" },
      { resolvedAdapter: fakeAdapter() },
    );

    expect(result.status).toBe("created");
    expect(result.cacheHit).toBe(true);
    expect(result.cachedRunId).toBe("cached-run");
    // The audit row is created as a cache hit and completed succeeded with the
    // cached output — but no LLM call is ever made.
    expect((createLlmRun as Mock).mock.calls[0]?.[0]).toMatchObject({ cacheHit: true });
    expect((updateLlmRun as Mock).mock.calls[0]?.[1]).toMatchObject({ status: "succeeded" });
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(generate).not.toHaveBeenCalled();
  });

  it("forceRefresh bypasses a valid cache and calls the LLM", async () => {
    (getLatestSuccessfulInsightRunByIdentity as Mock).mockResolvedValue(cachedRun());

    const result = await runLlmTask(
      { workflow: "aiInsights", entityType: "portfolio", forceRefresh: true },
      { resolvedAdapter: fakeAdapter() },
    );

    expect(result.status).toBe("created");
    expect(result.cacheHit).toBeFalsy();
    expect((createLlmRun as Mock).mock.calls[0]?.[0]).toMatchObject({ cacheHit: false });
    await vi.waitFor(() => expect(generate).toHaveBeenCalledTimes(1));
  });
});
