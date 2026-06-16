import { describe, expect, it } from "vitest";

import { planLlmRunPublishTransition } from "../src/llm-runs";

describe("planLlmRunPublishTransition", () => {
  it("publishes a succeeded run when nothing is published yet", () => {
    expect(planLlmRunPublishTransition({ id: "a", status: "succeeded" }, null)).toEqual({
      publishId: "a",
      demoteId: null,
    });
  });

  it("demotes the currently published run for the same workflow when publishing another", () => {
    expect(planLlmRunPublishTransition({ id: "b", status: "succeeded" }, "a")).toEqual({
      publishId: "b",
      demoteId: "a",
    });
  });

  it("is a no-op when the target is already published", () => {
    expect(planLlmRunPublishTransition({ id: "a", status: "published" }, "a")).toEqual({
      publishId: null,
      demoteId: null,
    });
  });

  it("refuses to publish a run that has not succeeded", () => {
    expect(() => planLlmRunPublishTransition({ id: "a", status: "failed" }, null)).toThrow(
      /Only succeeded runs can be published/,
    );
  });
});
