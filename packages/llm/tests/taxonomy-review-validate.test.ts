import { describe, expect, it } from "vitest";

import type { TaxonomyReviewInput } from "@portfolio/validators";
import { validateTaxonomyReviewOutput } from "../src/taxonomy-review/validate";

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
        ref: {
          type: "experience",
          id: "platform-lead",
          title: "Platform Lead",
        },
        title: "Platform Lead",
        status: "published",
        summary: "Led platform delivery with TypeScript and React.",
      },
    ],
    caseStudies: [],
    projects: [
      {
        ref: {
          type: "project",
          id: "design-system",
          title: "Design System",
        },
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

describe("validateTaxonomyReviewOutput", () => {
  it("keeps suggestions with valid primary evidence", () => {
    const result = validateTaxonomyReviewOutput(
      JSON.stringify({
        suggestions: [
          {
            targetGroup: "skills",
            action: "rename",
            currentValue: "JS",
            proposedValue: "JavaScript",
            reason: "Primary records use the fuller term.",
            confidence: "high",
            evidenceRefs: [
              { type: "project", id: "design-system", title: "Design System" },
            ],
          },
        ],
      }),
      input,
    );

    expect(result.output.suggestions).toHaveLength(1);
    expect(result.notes).toHaveLength(0);
  });

  it("drops suggestions that lose all primary evidence", () => {
    const result = validateTaxonomyReviewOutput(
      JSON.stringify({
        suggestions: [
          {
            targetGroup: "tags",
            action: "add",
            proposedValue: "Frontend Platform",
            reason: "Unsupported citation should remove this.",
            confidence: "medium",
            evidenceRefs: [
              { type: "project", id: "missing-project", title: "Missing" },
            ],
          },
        ],
      }),
      input,
    );

    expect(result.output.suggestions).toHaveLength(0);
    expect(result.notes.some((note) => note.includes("no valid primary evidence"))).toBe(true);
  });

  it("deduplicates repeated suggestions", () => {
    const suggestion = {
      targetGroup: "skills",
      action: "rename",
      currentValue: "JS",
      proposedValue: "JavaScript",
      reason: "Primary records use the fuller term.",
      confidence: "medium",
      evidenceRefs: [{ type: "experience", id: "platform-lead", title: "Platform Lead" }],
    };

    const result = validateTaxonomyReviewOutput(
      JSON.stringify({ suggestions: [suggestion, suggestion] }),
      input,
    );

    expect(result.output.suggestions).toHaveLength(1);
    expect(result.notes.some((note) => note.includes("duplicate"))).toBe(true);
  });
});
