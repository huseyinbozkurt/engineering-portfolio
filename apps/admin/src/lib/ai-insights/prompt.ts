import type { PortfolioInsightSnapshot } from "./types";

export function buildAiInsightsPrompt(snapshot: PortfolioInsightSnapshot): {
  system: string;
  user: string;
} {
  return {
    system: [
      "You are a portfolio evaluator for a private admin dashboard.",
      "You must analyze only the portfolio data provided by the user message.",
      "Do not invent experience, skills, metrics, achievements, projects, employers, dates, or outcomes.",
      "Do not suggest creating fake content. Recommended improvements must be editorial or structural and grounded in the existing data.",
      "Return strict JSON only. Do not wrap it in markdown.",
      "Every evidence array must cite exact record titles, skill names, tag names, or category labels from the provided data.",
      "For technicalSkillDistribution.segments, labels must be skillDistribution categories and values must be exact category counts from the provided data.",
      "Keep JSON compact enough to finish: each string under 160 characters, strengths/gaps/evidence arrays at most 3 items, item arrays at most 3 items, repeatedThemes and groundedDataNotes at most 5 items.",
    ].join(" "),
    user: [
      "Analyze this existing portfolio dataset and produce a structured visual report payload.",
      "The response must match this JSON shape:",
      JSON.stringify(responseShape(), null, 2),
      "Portfolio dataset:",
      JSON.stringify(snapshot, null, 2),
    ].join("\n\n"),
  };
}

function responseShape() {
  return {
    overallPortfolioStrength: {
      score: 0,
      level: "weak | moderate | strong",
      summary: "Grounded summary.",
      strengths: ["Grounded strength."],
      gaps: ["Grounded gap."],
      evidence: ["Exact record or category label."],
    },
    experienceCoverage: {
      score: 0,
      level: "weak | moderate | strong",
      summary: "Grounded summary.",
      strengths: ["Grounded strength."],
      gaps: ["Grounded gap."],
      evidence: ["Exact record or category label."],
    },
    technicalSkillDistribution: {
      summary: "Grounded summary.",
      segments: [
        {
          label: "Skill category from the data.",
          value: 0,
          level: "weak | moderate | strong",
          summary: "Grounded category summary.",
        },
      ],
      gaps: ["Grounded technical distribution gap."],
    },
    leadershipOwnershipSignals: {
      score: 0,
      summary: "Grounded summary.",
      signals: [
        {
          title: "Grounded signal title.",
          detail: "Grounded detail.",
          priority: "high | medium | low",
          evidence: ["Exact record or category label."],
        },
      ],
    },
    missingOrWeakAreas: [
      {
        title: "Grounded weak area.",
        detail: "Why it is weak based on the data.",
        priority: "high | medium | low",
        evidence: ["Exact record or category label."],
      },
    ],
    recommendedImprovements: [
      {
        title: "Grounded recommendation.",
        detail: "How to improve existing portfolio content without inventing facts.",
        priority: "high | medium | low",
        evidence: ["Exact record or category label."],
      },
    ],
    repeatedThemes: ["Theme visible across existing records."],
    inconsistencies: [
      {
        title: "Grounded inconsistency.",
        detail: "Why it is inconsistent based on the data.",
        priority: "high | medium | low",
        evidence: ["Exact record or category label."],
      },
    ],
    groundedDataNotes: ["Note about data limits or confidence."],
  };
}
