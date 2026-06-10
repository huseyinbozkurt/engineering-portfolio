import { describe, expect, it } from "vitest";

import {
  aiInsightRunStatusSchema,
  evidenceRefSchema,
  portfolioInsightOutputSchema,
} from "../src/insights";

const evidence = [{ ref: "experience:acme", note: "shows delivery ownership" }];
const statement = { summary: "Grounded summary.", confidence: "medium", evidence };

function validOutput(): Record<string, unknown> {
  return {
    executiveSummary: statement,
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
      recruiter: statement,
      hiringManager: statement,
      staffEngineer: statement,
      startupFounder: statement,
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
    signalRadar: {
      frontendEngineering: { score: 70, evidence },
      technicalLeadership: { score: 40, evidence },
      systemDesign: { score: 30, evidence },
      devopsCloud: { score: 0, evidence: [] },
      aiEngineering: { score: 0, evidence: [] },
      peopleManagement: { score: 20, evidence },
    },
    groundedDataNotes: ["Based on a single employer's records."],
  };
}

describe("portfolioInsightOutputSchema", () => {
  it("accepts a complete, well-formed report", () => {
    expect(portfolioInsightOutputSchema.safeParse(validOutput()).success).toBe(true);
  });

  it("rejects a report missing a section", () => {
    const { signalRadar: _omitted, ...incomplete } = validOutput();
    expect(portfolioInsightOutputSchema.safeParse(incomplete).success).toBe(false);
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

  it("rejects non-integer or out-of-range radar scores", () => {
    const fractional = validOutput();
    (fractional.signalRadar as Record<string, { score: number }>).frontendEngineering.score = 70.5;
    expect(portfolioInsightOutputSchema.safeParse(fractional).success).toBe(false);

    const tooHigh = validOutput();
    (tooHigh.signalRadar as Record<string, { score: number }>).frontendEngineering.score = 101;
    expect(portfolioInsightOutputSchema.safeParse(tooHigh).success).toBe(false);
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
