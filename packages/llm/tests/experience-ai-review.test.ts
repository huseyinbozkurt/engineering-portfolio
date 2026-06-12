import { describe, expect, it } from "vitest";

import {
  ExperienceAiReviewValidationError,
  parseExperienceAiReviewOutput,
} from "../src/experiences/ai-review";

describe("experience AI review parser", () => {
  it("accepts a valid strict JSON review", () => {
    const output = parseExperienceAiReviewOutput(
      JSON.stringify({
        qualityScore: 78,
        summary: "Strong experience entry with concrete scope and readable structure.",
        strengths: ["Clear role context"],
        issues: ["Some outcomes are thin"],
        suggestions: ["Add specific delivery context where available"],
      }),
    );

    expect(output.qualityScore).toBe(78);
    expect(output.suggestions).toHaveLength(1);
  });

  it("rejects non-JSON responses", () => {
    expect(() => parseExperienceAiReviewOutput("Looks good")).toThrow(
      ExperienceAiReviewValidationError,
    );
  });

  it("rejects quality scores outside 0-100", () => {
    expect(() =>
      parseExperienceAiReviewOutput(
        JSON.stringify({
          qualityScore: 120,
          summary: "Invalid score.",
          strengths: [],
          issues: [],
          suggestions: [],
        }),
      ),
    ).toThrow(/qualityScore/);
  });
});
