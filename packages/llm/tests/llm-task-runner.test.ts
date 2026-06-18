import { describe, expect, it } from "vitest";

import type { PortfolioInsightInput, TaxonomyReviewInput } from "@portfolio/validators";

import {
  LlmValidationError,
  buildVariablesForWorkflow,
  validateTemplateVariables,
} from "../src/services/llm-task-runner";
import { makeInput } from "./fixtures";

const taxonomyInput: TaxonomyReviewInput = {
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

function emptyInsightInput(): PortfolioInsightInput {
  const base = makeInput();
  return {
    ...base,
    meta: {
      ...base.meta,
      totals: {
        lenses: 0,
        principles: 0,
        decisionPatterns: 0,
        experiences: 0,
        projects: 0,
        caseStudies: 0,
        skills: 0,
        tags: 0,
      },
    },
  };
}

describe("buildVariablesForWorkflow", () => {
  it("produces the response-shape contract and serialized dataset for aiInsights", () => {
    const variables = buildVariablesForWorkflow("aiInsights", makeInput());

    expect(Object.keys(variables).sort()).toEqual(["dataset", "responseShape"]);
    expect(variables.responseShape ?? "").toContain("executiveSummary");
    expect(variables.dataset ?? "").toContain("experience:acme-senior-engineer");
  });

  it("produces the response-shape contract and serialized dataset for taxonomyReview", () => {
    const variables = buildVariablesForWorkflow("taxonomyReview", taxonomyInput);

    expect(Object.keys(variables).sort()).toEqual(["dataset", "responseShape"]);
    expect(variables.responseShape ?? "").toContain("targetGroup");
    expect(variables.dataset ?? "").toContain("Platform Lead");
  });

  it("throws when the portfolio snapshot has nothing to analyze", () => {
    expect(() => buildVariablesForWorkflow("aiInsights", emptyInsightInput())).toThrow(
      LlmValidationError,
    );
  });
});

describe("validateTemplateVariables", () => {
  it("accepts a template that uses only the required dataset variable", () => {
    expect(() => validateTemplateVariables("Data: {{dataset}}", "aiInsights")).not.toThrow();
  });

  it("still accepts the now-optional responseShape variable (back-compat)", () => {
    expect(() =>
      validateTemplateVariables("Shape: {{responseShape}}\nData: {{dataset}}", "aiInsights"),
    ).not.toThrow();
  });

  it("rejects a template missing the required dataset variable", () => {
    expect(() => validateTemplateVariables("Only {{responseShape}}", "aiInsights")).toThrow(
      /dataset/,
    );
  });

  it("rejects a template that references an unknown variable", () => {
    expect(() =>
      validateTemplateVariables("{{responseShape}} {{dataset}} {{bogus}}", "aiInsights"),
    ).toThrow(/bogus/);
  });
});
