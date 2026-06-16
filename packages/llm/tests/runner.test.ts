import { describe, expect, it } from "vitest";

import { LlmHttpError } from "../src/adapters/http";
import { MockAdapter } from "../src/adapters/mock-adapter";
import type { LLMAdapter, LLMGenerateParams } from "../src/adapters/types";
import { runPortfolioInsight, type InsightRunStore } from "../src/insights/runner";
import { makeInput, makeOutput } from "./fixtures";

type StorePatch = Parameters<InsightRunStore["update"]>[1];

function makeStore(options: { failOnSucceeded?: boolean } = {}) {
  const updates: Array<{ id: string; patch: StorePatch }> = [];
  const store: InsightRunStore = {
    async update(id, patch) {
      if (options.failOnSucceeded && patch.status === "succeeded") {
        throw new Error("db unavailable");
      }
      updates.push({ id, patch });
    },
  };
  return { store, updates };
}

const noSleep = async () => {};

describe("runPortfolioInsight", () => {
  it("persists a succeeded run with output, notes, usage, and attempts", async () => {
    const { store, updates } = makeStore();
    const adapter = new MockAdapter({
      model: "mock-1",
      respond: () => JSON.stringify(makeOutput()),
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
    });

    const result = await runPortfolioInsight({
      runId: "run-1",
      input: makeInput(),
      adapter,
      store,
      sleep: noSleep,
    });

    expect(result.status).toBe("succeeded");
    expect(updates).toHaveLength(1);
    const patch = updates[0]!.patch;
    expect(patch.status).toBe("succeeded");
    expect(patch.outputJson?.strengthSignals.length).toBeGreaterThan(0);
    expect(patch.tokenUsage?.totalTokens).toBe(150);
    expect(patch.attempts).toHaveLength(1);
    expect(patch.durationMs).toBeGreaterThanOrEqual(0);
    expect(patch.errorStage).toBeNull();
  });

  it("persists a failed run with the validation stage when output is not JSON", async () => {
    const { store, updates } = makeStore();
    const adapter = new MockAdapter({ respond: () => "I refuse to answer in JSON." });

    const result = await runPortfolioInsight({
      runId: "run-2",
      input: makeInput(),
      adapter,
      store,
      sleep: noSleep,
    });

    expect(result).toEqual({ status: "failed", errorStage: "json" });
    const patch = updates[0]!.patch;
    expect(patch.status).toBe("failed");
    expect(patch.errorStage).toBe("json");
    expect(patch.rawResponse).toContain("I refuse");
  });

  it("retries transient failures and records every attempt", async () => {
    const { store, updates } = makeStore();
    let calls = 0;
    const flaky: LLMAdapter = {
      async generate() {
        calls += 1;
        if (calls === 1) {
          throw new LlmHttpError("LLM request returned HTTP 503.", 503);
        }
        return { text: JSON.stringify(makeOutput()) };
      },
      getProvider: () => "custom",
      getModel: () => "flaky-model",
    };

    const result = await runPortfolioInsight({
      runId: "run-3",
      input: makeInput(),
      adapter: flaky,
      store,
      sleep: noSleep,
    });

    expect(result.status).toBe("succeeded");
    expect(calls).toBe(2);
    const patch = updates[0]!.patch;
    expect(patch.attempts).toHaveLength(2);
    expect(patch.attempts?.[0]?.errorMessage).toContain("503");
    expect(patch.attempts?.[1]?.errorMessage).toBeNull();
  });

  it("fails after exhausting retries on timeouts", async () => {
    const { store, updates } = makeStore();
    const adapter = new MockAdapter({
      failWith: new LlmHttpError("LLM request timed out after 90s.", null, true),
    });

    const result = await runPortfolioInsight({
      runId: "run-4",
      input: makeInput(),
      adapter,
      store,
      maxAttempts: 2,
      sleep: noSleep,
    });

    expect(result).toEqual({ status: "failed", errorStage: "request" });
    expect(updates[0]!.patch.attempts).toHaveLength(2);
  });

  it("does not retry non-transient provider errors", async () => {
    const { store, updates } = makeStore();
    const adapter = new MockAdapter({
      failWith: new LlmHttpError("LLM request returned HTTP 401.", 401),
    });

    const result = await runPortfolioInsight({
      runId: "run-5",
      input: makeInput(),
      adapter,
      store,
      sleep: noSleep,
    });

    expect(result.status).toBe("failed");
    expect(updates[0]!.patch.attempts).toHaveLength(1);
  });

  it("reports a persist failure when the succeeded write cannot land", async () => {
    const { store } = makeStore({ failOnSucceeded: true });
    const adapter = new MockAdapter({ respond: () => JSON.stringify(makeOutput()) });

    const result = await runPortfolioInsight({
      runId: "run-6",
      input: makeInput(),
      adapter,
      store,
      sleep: noSleep,
    });

    expect(result).toEqual({ status: "failed", errorStage: "persist" });
  });

  it("retries a schema-validation failure and succeeds on a later attempt", async () => {
    const { store, updates } = makeStore();
    let calls = 0;
    const adapter: LLMAdapter = {
      async generate() {
        calls += 1;
        // Attempt 1: valid JSON but wrong shape (schema stage). Attempt 2: valid.
        return { text: calls === 1 ? JSON.stringify({ not: "a report" }) : JSON.stringify(makeOutput()) };
      },
      getProvider: () => "custom",
      getModel: () => "retry-model",
    };

    const result = await runPortfolioInsight({
      runId: "run-validate-retry",
      input: makeInput(),
      adapter,
      store,
      sleep: noSleep,
    });

    expect(result.status).toBe("succeeded");
    expect(calls).toBe(2);
    const patch = updates[0]!.patch;
    expect(patch.attempts).toHaveLength(2);
    // The failed attempt records the failing stage AND its raw output.
    expect(patch.attempts?.[0]?.validationErrorStage).toBe("schema");
    expect(patch.attempts?.[0]?.rawResponse).toContain("a report");
    expect(patch.attempts?.[0]?.errorMessage).toContain("schema");
    expect(patch.attempts?.[1]?.errorMessage).toBeNull();
    expect(patch.outputJson?.strengthSignals.length).toBeGreaterThan(0);
  });

  it("exhausts validation retries and persists the failing stage with the raw output", async () => {
    const { store, updates } = makeStore();
    let calls = 0;
    const adapter = new MockAdapter({
      respond: () => {
        calls += 1;
        return JSON.stringify({ still: "wrong shape" });
      },
    });

    const result = await runPortfolioInsight({
      runId: "run-validate-exhaust",
      input: makeInput(),
      adapter,
      store,
      maxAttempts: 3,
      sleep: noSleep,
    });

    expect(result).toEqual({ status: "failed", errorStage: "schema" });
    expect(calls).toBe(3);
    const patch = updates[0]!.patch;
    expect(patch.attempts).toHaveLength(3);
    expect(patch.attempts?.every((a) => a.validationErrorStage === "schema")).toBe(true);
    expect(patch.rawResponse).toContain("wrong shape");
  });

  it("forwards the generation option to the adapter (and omits it when unset)", async () => {
    const { store } = makeStore();
    const captured: Array<LLMGenerateParams["generation"]> = [];
    const adapter: LLMAdapter = {
      async generate(params) {
        captured.push(params.generation);
        return { text: JSON.stringify(makeOutput()) };
      },
      getProvider: () => "custom",
      getModel: () => "gen-model",
    };

    await runPortfolioInsight({
      runId: "run-gen",
      input: makeInput(),
      adapter,
      store,
      generation: { temperature: 0.1, topP: 0.8, maxTokens: 30001 },
      sleep: noSleep,
    });
    expect(captured[0]).toEqual({ temperature: 0.1, topP: 0.8, maxTokens: 30001 });

    await runPortfolioInsight({
      runId: "run-gen-default",
      input: makeInput(),
      adapter,
      store,
      sleep: noSleep,
    });
    // Unset → the runner sends no per-call generation, so adapter defaults apply.
    expect(captured[1]).toBeUndefined();
  });
});
