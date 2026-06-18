import { describe, expect, it } from "vitest";

import {
  aiInsightRunStatusSchema,
  evidenceRefSchema,
  portfolioInsightOutputSchema,
} from "../src/insights";
import { getAiModelDisplayName } from "../src/ai-model-display";

const evidence = [{ ref: "experience:acme", note: "shows delivery ownership" }];
const statement = () => ({ summary: "Grounded summary.", confidence: "medium" as const, evidence });

function validOutput(): Record<string, unknown> {
  return {
    executiveSummary: statement(),
    strengthSignals: [
      { title: "Delivery Excellence", summary: "Documented improvements.", confidence: "high", evidence },
    ],
    blindSpots: [
      {
        title: "Architecture Visibility",
        summary: "Thin architecture narrative.",
        impact: "Readers miss system-level thinking.",
        recommendation: "Expand the case study.",
        confidence: "low",
        evidence: [],
      },
    ],
    careerTrajectory: {
      stages: [
        { title: "Execution-Focused Engineer", timeframe: "2019-2021", explanation: "Hands-on delivery.", evidence },
        { title: "Systems Builder", timeframe: "2021-2023", explanation: "Platform ownership.", evidence },
      ],
    },
    recruiterSimulation: {
      recruiter: statement(),
      hiringManager: statement(),
      staffEngineer: statement(),
      startupFounder: statement(),
    },
    opportunityHeatmap: [
      {
        opportunity: "Document architecture",
        expectedImpact: "high",
        estimatedEffort: "medium",
        recommendation: "Add an architecture section.",
        evidence,
      },
    ],
    groundedDataNotes: ["Based on a single employer's records."],
    homePageContent: {
      eyebrow: "AI Portfolio Insight",
      headline: "Evidence-backed engineering signal.",
      summary: "A short homepage summary grounded in the same report.",
      primarySignals: [
        {
          title: "Delivery signal",
          summary: "Evidence-backed delivery signal.",
          confidence: "medium",
          evidence,
        },
      ],
      proofPoints: [
        {
          label: "Release success",
          value: "85%",
          context: "Release success improved in the cited experience.",
          evidence,
        },
      ],
      capabilitySnapshot: [
        {
          label: "Frontend Engineering",
          radarKey: "frontendEngineering",
          summary: "Presented as homepage copy, scored from signalRadar.",
          evidence,
          score: 75
        },
      ],
      cta: {
        label: "View full AI insight",
        href: "/ai-insights",
      },
    },
  };
}

describe("portfolioInsightOutputSchema", () => {
  it("accepts a complete, well-formed report", () => {
    expect(portfolioInsightOutputSchema.safeParse(validOutput()).success).toBe(true);
  });


  it("rejects unknown confidence values", () => {
    const bad = validOutput();
    (bad.executiveSummary as { confidence: string }).confidence = "certain";
    expect(portfolioInsightOutputSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects extra keys on strict objects", () => {
    const bad = { ...validOutput(), vibe: "immaculate" };
    expect(portfolioInsightOutputSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects more than 6 strength signals", () => {
    const bad = validOutput();
    bad.strengthSignals = Array.from({ length: 7 }, (_, index) => ({
      title: `Strength ${index}`,
      summary: "s",
      confidence: "low",
      evidence,
    }));
    expect(portfolioInsightOutputSchema.safeParse(bad).success).toBe(false);
  });


  it("requires at least one evidence entry on strengths but none on blind spots", () => {
    const noStrengthEvidence = validOutput();
    (noStrengthEvidence.strengthSignals as Array<{ evidence: unknown[] }>)[0]!.evidence = [];
    expect(portfolioInsightOutputSchema.safeParse(noStrengthEvidence).success).toBe(false);
  });

  it("requires fewer than 2 trajectory stages to fail", () => {
    const bad = validOutput();
    (bad.careerTrajectory as { stages: unknown[] }).stages = [
      (bad.careerTrajectory as { stages: unknown[] }).stages[0],
    ];
    expect(portfolioInsightOutputSchema.safeParse(bad).success).toBe(false);
  });

  it("accepts legacy homepage capabilities with scores but no radarKey", () => {
    const legacy = validOutput();
    legacy.homePageContent = {
      ...(legacy.homePageContent as Record<string, unknown>),
      capabilitySnapshot: [
        {
          label: "Frontend Engineering",
          score: 12,
          summary: "Legacy generated score should parse but not drive UI.",
          evidence,
        },
      ],
    };

    const parsed = portfolioInsightOutputSchema.safeParse(legacy);
    expect(parsed.success).toBe(true);
  });

  it("rejects older reports without homepage content", () => {
    const { homePageContent: _homePageContent, ...older } = validOutput();
    expect(portfolioInsightOutputSchema.safeParse(older).success).toBe(false);
  });
});

describe("getAiModelDisplayName", () => {
  it("uses configured display names before falling back", () => {
    expect(getAiModelDisplayName({ provider: "openai", model: "gpt-4.1" })).toBe("GPT-4.1");
    expect(getAiModelDisplayName({ provider: "custom", model: "unknown-model" })).toBe(
      "unknown-model",
    );
    expect(getAiModelDisplayName({ provider: "custom", model: null })).toBe("custom");
    expect(getAiModelDisplayName({ provider: null, model: null })).toBe("AI model");
  });
});

describe("evidenceRefSchema", () => {
  it("requires a non-empty ref and allows an optional note", () => {
    expect(evidenceRefSchema.safeParse({ ref: "skill:typescript" }).success).toBe(true);
    expect(evidenceRefSchema.safeParse({ ref: "" }).success).toBe(false);
    expect(evidenceRefSchema.safeParse({ ref: "x", extra: 1 }).success).toBe(false);
  });
});

describe("aiInsightRunStatusSchema", () => {
  it("accepts the five lifecycle statuses and nothing else", () => {
    for (const status of ["pending", "running", "succeeded", "failed", "published"]) {
      expect(aiInsightRunStatusSchema.safeParse(status).success).toBe(true);
    }
    expect(aiInsightRunStatusSchema.safeParse("archived").success).toBe(false);
  });
});
