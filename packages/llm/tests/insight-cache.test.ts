import { describe, expect, it } from "vitest";

import type { LlmRunRecord } from "@portfolio/db/llm-runs";

import {
  buildInsightIdentity,
  computeConfigHash,
  findValidCachedInsightRun,
  parseUsableInsightOutput,
  type InsightCacheIdentity,
} from "../src/services/insight-cache";
import { resolveWorkflowConfig, type ActiveConfigLike } from "../src/management/config-resolution";
import { makeInput, makeOutput } from "./fixtures";

function config(overrides: Partial<ActiveConfigLike> = {}) {
  return resolveWorkflowConfig({
    id: "cfg-1",
    provider: "openai",
    model: "gpt-x",
    visibleModelName: null,
    baseUrl: null,
    temperature: 0.2,
    topP: 0.9,
    maxTokens: 8000,
    maxRetries: 2,
    timeoutMs: null,
    ...overrides,
  });
}

/** Minimal stand-in for a stored run; only fields the cache reads are set. */
function fakeRun(outputJson: unknown): LlmRunRecord {
  return { id: "cached-1", outputJson } as unknown as LlmRunRecord;
}

describe("computeConfigHash", () => {
  it("is stable for equivalent configs", () => {
    expect(computeConfigHash(config())).toBe(computeConfigHash(config()));
  });

  it("changes when an output-affecting setting changes", () => {
    expect(computeConfigHash(config())).not.toBe(computeConfigHash(config({ temperature: 0.7 })));
    expect(computeConfigHash(config())).not.toBe(computeConfigHash(config({ topP: 0.5 })));
    expect(computeConfigHash(config())).not.toBe(computeConfigHash(config({ maxTokens: 4000 })));
    expect(computeConfigHash(config())).not.toBe(
      computeConfigHash(config({ provider: "anthropic" })),
    );
  });

  it("ignores operational settings that do not affect output", () => {
    expect(computeConfigHash(config())).toBe(computeConfigHash(config({ maxRetries: 5 })));
    expect(computeConfigHash(config())).toBe(computeConfigHash(config({ timeoutMs: 99000 })));
  });
});

describe("buildInsightIdentity", () => {
  const base = {
    input: makeInput(),
    config: config(),
    effectiveModel: "gpt-x",
    promptVersionId: null,
    promptVersion: "portfolio-insight-v5",
  };

  it("packs the full composite identity", () => {
    const { identity, datasetHash, configHash } = buildInsightIdentity(base);
    expect(identity).toMatchObject({
      workflow: "aiInsights",
      datasetHash,
      configHash,
      model: "gpt-x",
      promptVersionId: null,
      promptVersion: "portfolio-insight-v5",
    });
  });

  it("differs when prompt, model, or config differ even with the same dataset", () => {
    const baseId = buildInsightIdentity(base).identity;
    const diffModel = buildInsightIdentity({ ...base, effectiveModel: "gpt-y" }).identity;
    const diffPrompt = buildInsightIdentity({ ...base, promptVersion: "portfolio-insight-v4" }).identity;
    const diffConfig = buildInsightIdentity({ ...base, config: config({ temperature: 0.9 }) }).identity;

    expect(diffModel.model).not.toBe(baseId.model);
    expect(diffPrompt.promptVersion).not.toBe(baseId.promptVersion);
    expect(diffConfig.configHash).not.toBe(baseId.configHash);
    // The dataset is unchanged across all of them.
    expect(diffModel.datasetHash).toBe(baseId.datasetHash);
    expect(diffPrompt.datasetHash).toBe(baseId.datasetHash);
  });
});

describe("parseUsableInsightOutput", () => {
  it("accepts a schema- and homepage-valid output", () => {
    expect(parseUsableInsightOutput(makeOutput())).not.toBeNull();
  });

  it("rejects null / structurally invalid output", () => {
    expect(parseUsableInsightOutput(null)).toBeNull();
    expect(parseUsableInsightOutput({})).toBeNull();
  });

  it("rejects output missing homePageContent (current homepage rule)", () => {
    expect(parseUsableInsightOutput(makeOutput({ homePageContent: undefined }))).toBeNull();
  });
});

describe("findValidCachedInsightRun", () => {
  const identity: InsightCacheIdentity = buildInsightIdentity({
    input: makeInput(),
    config: config(),
    effectiveModel: "gpt-x",
    promptVersionId: null,
    promptVersion: "portfolio-insight-v5",
  }).identity;

  it("returns the cached output when the lookup hits and the output validates", async () => {
    const result = await findValidCachedInsightRun(identity, async () => fakeRun(makeOutput()));
    expect(result?.run.id).toBe("cached-1");
    expect(result?.output.strengthSignals.length).toBeGreaterThan(0);
  });

  it("returns null when the lookup misses", async () => {
    expect(await findValidCachedInsightRun(identity, async () => null)).toBeNull();
  });

  it("returns null when the cached output no longer validates", async () => {
    expect(await findValidCachedInsightRun(identity, async () => fakeRun({}))).toBeNull();
  });
});
