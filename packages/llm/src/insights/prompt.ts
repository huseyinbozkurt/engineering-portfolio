import type { PortfolioInsightInput } from "@portfolio/validators";

/**
 * Versioned prompt builders. Every run records the prompt version it used, so
 * historical runs remain interpretable after prompt changes. New versions are
 * ADDED to the registry — existing entries must never be edited or removed.
 */

export interface BuiltInsightPrompt {
  system: string;
  user: string;
}

export interface InsightPromptVersion {
  version: string;
  build(input: PortfolioInsightInput): BuiltInsightPrompt;
}

export const PORTFOLIO_INSIGHT_PROMPT_V1 = "portfolio-insight-v1";

const promptV1: InsightPromptVersion = {
  version: PORTFOLIO_INSIGHT_PROMPT_V1,
  build(input) {
    return {
      system: [
        "You are a rigorous career-intelligence analyst evaluating an engineering portfolio for an executive readout.",
        "Analyze ONLY the records in the provided dataset. Never invent achievements, metrics, projects, employers, dates, skills, responsibilities, outcomes, or leadership claims.",
        "",
        "EVIDENCE HIERARCHY:",
        "- PRIMARY EVIDENCE: experiences, projects, and caseStudies (these are your strongest sources)",
        "- SUPPORTING EVIDENCE: principles, lenses, decisionPatterns, skills, tags, relatedRefs (support only)",
        "- Supporting evidence must never justify high confidence by itself",
        "- When an experience, project, and case study describe the same work, treat them as a single evidence cluster",
        "",
        "CONFIDENCE RULES:",
        "- 'high': at least two strong primary evidence records support the claim",
        "- 'medium': one strong primary evidence record OR two medium primary evidence records",
        "- 'low': evidence is thin, ambiguous, metadata-heavy, or relies primarily on summaries",
        "",
        "RADAR SCORING RULES (0-100 integers):",
        "- 90-100: repeated strong evidence across multiple evidence clusters",
        "- 75-89: multiple strong primary records with demonstrated outcomes",
        "- 60-74: at least one strong implementation example",
        "- 40-59: mostly summary-level support",
        "- 20-39: weak signal with limited support",
        "- 0-19: little or no meaningful evidence",
        "",
        "REPORT VALIDATION:",
        "Before returning the final report, validate that:",
        "- Every evidence ref exists in the dataset (check all refs against input.records)",
        "- Enum values exactly match allowed values (low/medium/high for confidence, etc.)",
        "- All required schema fields are present with correct types",
        "- Radar scores are integers between 0 and 100",
        "- Output is valid JSON only",
        "- No markdown, explanations, warnings, or commentary outside JSON response",
        "",
        "BLIND SPOTS:",
        "- Describe PRESENTATION gaps in the portfolio (what is missing, thin, under-evidenced)",
        "- Never invent missing experience; frame as actionable improvements to portfolio itself",
        "",
        "EVIDENCE CITING:",
        "- Every claim must cite evidence using refs EXACTLY as written in dataset (e.g. 'experience:acme-staff-engineer')",
        "- Evidence entries are objects {\"ref\": \"...\", \"note\": \"...\"}",
        "- Never fabricate refs or notes",
        "- StrengthSignals, blindSpots, trajectory stages, opportunityHeatmap evidence arrays max 6 entries each",
        "",
        "LENGTH BUDGETS:",
        "- titles: <= 200 chars",
        "- summaries/explanations/recommendations: <= 700 chars",
        "- each evidence array: <= 6 entries",
        "- strengthSignals: 1-6 items",
        "- blindSpots: 1-6 items",
        "- trajectory stages: 2-6 items",
        "- opportunityHeatmap: 1-8 items",
        "- groundedDataNotes: 1-8 items",
        "",
        "Return STRICT JSON only matching the response shape exactly.",
      ].join("\n"),
      user: [
        "Produce the portfolio intelligence report for this dataset.",
        "",
        "RESPONSE SHAPE (do not add, remove, rename, reorder, or omit any keys):",
        JSON.stringify(responseShape(), null, 2),
        "",
        "DATASET (analyze ONLY this data; cite refs exactly as written):",
        JSON.stringify(input),
      ].join("\n"),
    };
  },
};

export const insightPromptVersions: Record<string, InsightPromptVersion> = {
  [PORTFOLIO_INSIGHT_PROMPT_V1]: promptV1,
};

export const latestInsightPromptVersion = PORTFOLIO_INSIGHT_PROMPT_V1;

export function getInsightPromptVersion(version: string): InsightPromptVersion {
  const entry = insightPromptVersions[version];
  if (!entry) {
    throw new Error(`Unknown insight prompt version: ${version}`);
  }
  return entry;
}

function responseShape(): Record<string, unknown> {
  const evidence = [{ ref: "type:slug-from-dataset", note: "what this record shows" }];
  const statement = {
    summary: "Grounded analysis referencing the cited records.",
    confidence: "low | medium | high",
    evidence,
  };

  return {
    executiveSummary: statement,
    strengthSignals: [
      {
        title: "Strength name (e.g. Technical Leadership)",
        summary: "Why the cited records support this strength.",
        confidence: "low | medium | high",
        evidence,
      },
    ],
    blindSpots: [
      {
        title: "Presentation gap name (e.g. Architecture Visibility)",
        summary: "What is thin or missing in the portfolio itself.",
        impact: "How this gap affects how the portfolio reads.",
        recommendation: "Concrete editorial/structural improvement using existing material.",
        confidence: "low | medium | high",
        evidence,
      },
    ],
    careerTrajectory: {
      stages: [
        {
          title: "Stage label (e.g. Execution-Focused Engineer)",
          timeframe: "e.g. 2017-2019, from record dates",
          explanation: "What the records from this period show.",
          evidence,
        },
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
        opportunity: "Improvement opportunity",
        expectedImpact: "low | medium | high",
        estimatedEffort: "low | medium | high",
        recommendation: "Actionable next step grounded in existing data.",
        evidence,
      },
    ],
    signalRadar: {
      frontendEngineering: { score: 0, evidence },
      technicalLeadership: { score: 0, evidence },
      systemDesign: { score: 0, evidence },
      devopsCloud: { score: 0, evidence },
      aiEngineering: { score: 0, evidence },
      peopleManagement: { score: 0, evidence },
    },
    groundedDataNotes: ["Real limitation of this dataset."],
  };
}
