import { describe, expect, it } from "vitest";

import {
  taxonomyReviewOutputSchema,
  taxonomySuggestionSchema,
} from "../src/taxonomy-review";

const evidence = [
  {
    type: "project",
    id: "build-system",
    title: "Build System",
    note: "Shows repeated build tooling work.",
  },
];

describe("taxonomySuggestionSchema", () => {
  it("accepts a grounded rename suggestion", () => {
    expect(
      taxonomySuggestionSchema.safeParse({
        targetGroup: "skills",
        action: "rename",
        currentValue: "JS",
        proposedValue: "JavaScript",
        reason: "Primary project records use the full technology name.",
        confidence: "high",
        evidenceRefs: evidence,
      }).success,
    ).toBe(true);
  });

  it("requires action-specific values", () => {
    expect(
      taxonomySuggestionSchema.safeParse({
        targetGroup: "skills",
        action: "add",
        reason: "The primary records strongly imply this skill.",
        confidence: "medium",
        evidenceRefs: evidence,
      }).success,
    ).toBe(false);

    expect(
      taxonomySuggestionSchema.safeParse({
        targetGroup: "tags",
        action: "remove",
        reason: "The tag is stale.",
        confidence: "low",
        evidenceRefs: evidence,
      }).success,
    ).toBe(false);
  });

  it("rejects evidence refs that are not primary record types", () => {
    expect(
      taxonomySuggestionSchema.safeParse({
        targetGroup: "lenses",
        action: "remove",
        currentValue: "Legacy lens",
        reason: "Not supported by the canonical records.",
        confidence: "medium",
        evidenceRefs: [{ type: "skill", id: "typescript" }],
      }).success,
    ).toBe(false);
  });
});

describe("taxonomyReviewOutputSchema", () => {
  it("accepts a strict suggestions object", () => {
    expect(
      taxonomyReviewOutputSchema.safeParse({
        suggestions: [
          {
            targetGroup: "decisionPatterns",
            action: "merge",
            currentValue: "Fast feedback",
            proposedValue: "Feedback loops",
            reason: "The primary project records use the broader concept consistently.",
            confidence: "medium",
            evidenceRefs: evidence,
            affectedRecords: evidence,
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("rejects extra top-level keys", () => {
    expect(
      taxonomyReviewOutputSchema.safeParse({
        suggestions: [],
        primaryRecordEdits: [],
      }).success,
    ).toBe(false);
  });
});
