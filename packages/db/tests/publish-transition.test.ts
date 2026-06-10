import { describe, expect, it } from "vitest";

import { planPublishTransition } from "../src/ai-insight-runs";

describe("planPublishTransition", () => {
  it("publishes a succeeded run when nothing is published yet", () => {
    expect(planPublishTransition({ id: "a", status: "succeeded" }, null)).toEqual({
      publishId: "a",
      demoteId: null,
    });
  });

  it("demotes the currently published run when publishing another", () => {
    expect(planPublishTransition({ id: "b", status: "succeeded" }, "a")).toEqual({
      publishId: "b",
      demoteId: "a",
    });
  });

  it("is a no-op when the target is already published", () => {
    expect(planPublishTransition({ id: "a", status: "published" }, "a")).toEqual({
      publishId: null,
      demoteId: null,
    });
  });

  it("never demotes the target itself", () => {
    expect(planPublishTransition({ id: "a", status: "succeeded" }, "a")).toEqual({
      publishId: "a",
      demoteId: null,
    });
  });

  it.each(["pending", "running", "failed"] as const)(
    "rejects publishing a %s run",
    (status) => {
      expect(() => planPublishTransition({ id: "a", status }, null)).toThrow(
        "Only succeeded runs can be published",
      );
    },
  );
});
