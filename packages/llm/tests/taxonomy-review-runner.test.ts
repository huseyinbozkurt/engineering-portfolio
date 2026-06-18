import { describe, expect, it } from "vitest";

import type { TaxonomyReviewInput } from "@portfolio/validators";
import { MockAdapter } from "../src/adapters/mock-adapter";
import type { LLMAdapter, LLMGenerateParams } from "../src/adapters/types";
import { runTaxonomyReview, type TaxonomyReviewRunStore } from "../src/taxonomy-review/runner";

const input: TaxonomyReviewInput = {
  meta: {
    generatedAt: "2026-06-14T00:00:00.000Z",
    scope: "admin-all-records",
    totals: {
      experiences: 1,
      caseStudies: 0,
      projects: 1,
      skills: 1,
      tags: 0,
      lenses: 0,
      principles: 0,
      decisionPatterns: 0,
    },
  },
  primaryRecords: {
    experiences: [
      {
        ref: { type: "experience", id: "platform-lead", title: "Platform Lead" },
        title: "Platform Lead",
        status: "published",
        summary: "Led platform delivery with TypeScript and React.",
      },
    ],
    caseStudies: [],
    projects: [
      {
        ref: { type: "project", id: "design-system", title: "Design System" },
        title: "Design System",
        status: "published",
        summary: "Built a reusable frontend system.",
      },
    ],
  },
  supportingRecords: {
    skills: [
      {
        id: "skill-js",
        slug: "js",
        label: "JS",
        status: "published",
        usageCount: 1,
        usedBy: [{ type: "project", id: "design-system", title: "Design System" }],
      },
    ],
    tags: [],
    lenses: [],
    principles: [],
    decisionPatterns: [],
  },
};

const validOutput = JSON.stringify({
  suggestions: [
    {
      targetGroup: "skills",
      action: "rename",
      currentValue: "JS",
      proposedValue: "JavaScript",
      reason: "Primary records use the fuller term.",
      confidence: "high",
      evidenceRefs: [{ type: "project", id: "design-system", title: "Design System" }],
    },
  ],
});

type CompletePatch = Parameters<TaxonomyReviewRunStore["complete"]>[1];
type FailPatch = Parameters<TaxonomyReviewRunStore["update"]>[1];

function makeStore() {
  const completed: Array<{ id: string; patch: CompletePatch }> = [];
  const failed: Array<{ id: string; patch: FailPatch }> = [];
  const store: TaxonomyReviewRunStore = {
    async update(id, patch) {
      failed.push({ id, patch });
    },
    async complete(id, patch) {
      completed.push({ id, patch });
    },
  };
  return { store, completed, failed };
}

const noSleep = async () => {};
const prompt = { system: "Test system prompt", user: "Test user prompt" };

describe("runTaxonomyReview", () => {
  it("retries a schema-validation failure and completes on a later attempt", async () => {
    let calls = 0;
    const adapter: LLMAdapter = {
      async generate() {
        calls += 1;
        return { text: calls === 1 ? JSON.stringify({ not: "valid output" }) : validOutput };
      },
      getProvider: () => "custom",
      getModel: () => "tax-model",
    };
    const { store, completed } = makeStore();

    const result = await runTaxonomyReview({
      runId: "tax-retry",
      input,
      adapter,
      store,
      prompt,
      sleep: noSleep,
    });

    expect(result.status).toBe("succeeded");
    expect(calls).toBe(2);
    expect(completed).toHaveLength(1);
    const patch = completed[0]!.patch;
    expect(patch.attempts).toHaveLength(2);
    expect(patch.attempts?.[0]?.validationErrorStage).toBe("schema");
    expect(patch.attempts?.[0]?.rawResponse).toContain("valid output");
    expect(patch.attempts?.[1]?.errorMessage).toBeNull();
    expect(patch.outputJson?.suggestions).toHaveLength(1);
  });

  it("forwards the generation option to the adapter", async () => {
    const captured: Array<LLMGenerateParams["generation"]> = [];
    const adapter: LLMAdapter = {
      async generate(params) {
        captured.push(params.generation);
        return { text: validOutput };
      },
      getProvider: () => "custom",
      getModel: () => "tax-gen",
    };
    const { store } = makeStore();

    await runTaxonomyReview({
      runId: "tax-gen",
      input,
      adapter,
      store,
      prompt,
      generation: { temperature: 0.2, topP: 0.9, maxTokens: 32000 },
      sleep: noSleep,
    });

    expect(captured[0]).toEqual({ temperature: 0.2, topP: 0.9, maxTokens: 32000 });
  });

  it("fails with the schema stage after exhausting validation retries", async () => {
    const adapter = new MockAdapter({ respond: () => JSON.stringify({ bad: true }) });
    const { store, failed } = makeStore();

    const result = await runTaxonomyReview({
      runId: "tax-fail",
      input,
      adapter,
      store,
      prompt,
      maxAttempts: 2,
      sleep: noSleep,
    });

    expect(result).toEqual({ status: "failed", errorStage: "schema" });
    expect(failed).toHaveLength(1);
    expect(failed[0]!.patch.attempts).toHaveLength(2);
    expect(failed[0]!.patch.rawResponse).toContain("bad");
  });
});
