/**
 * Dev utility: executes the REAL insight pipeline end-to-end against the live
 * dev database — input collection, normalization, runner, staged validation,
 * persistence — substituting only the LLM HTTP call with a deterministic
 * MockAdapter. The mock report cites real refs from the built input plus one
 * fabricated ref, so the run also demonstrates evidence validation (the fake
 * ref is dropped and recorded in validationNotes).
 *
 * Usage: node_modules/.bin/tsx scripts/seed-mock-insight-run.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Load DATABASE_URL from the workspace-root .env.local before any db import.
const envFile = readFileSync(join(import.meta.dirname, "..", "..", "..", ".env.local"), "utf8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([A-Z0-9_]+)="?([^"\n]*)"?\s*$/);
  if (match && match[1] && process.env[match[1]] === undefined) {
    process.env[match[1]] = match[2];
  }
}

const { getPublishedInsightSource } = await import("@portfolio/db/queries");
const { createLlmRun, updateLlmRun } = await import("@portfolio/db/llm-runs");
const { closeDb } = await import("@portfolio/db/client");
const {
  MockAdapter,
  buildPortfolioInsightInput,
  createInsightLogger,
  getInsightPromptVersion,
  isInsightInputEmpty,
  latestInsightPromptVersion,
  runPortfolioInsight,
} = await import("@portfolio/llm");

const source = await getPublishedInsightSource();
const input = buildPortfolioInsightInput(source);

if (isInsightInputEmpty(input)) {
  console.error("Published portfolio is empty — nothing to analyze.");
  process.exit(1);
}

const ref = {
  experience: input.records.experiences[0]?.ref,
  project: input.records.projects[0]?.ref,
  caseStudy: input.records.caseStudies[0]?.ref,
  skill: input.records.skills[0]?.ref,
};

if (!ref.experience || !ref.project || !ref.caseStudy || !ref.skill) {
  console.error("Need at least one published experience, project, case study, and skill.");
  process.exit(1);
}

const cite = (...refs: Array<string | undefined>) =>
  refs.filter((value): value is string => Boolean(value)).map((value) => ({ ref: value }));

const statement = (summary: string, refs: Array<string | undefined>) => ({
  summary,
  confidence: "medium" as const,
  evidence: cite(...refs),
});

const report = {
  executiveSummary: statement(
    "The published records show consistent delivery ownership across employer work and personal projects, with measurable outcomes concentrated in release engineering and product tooling.",
    [ref.experience, ref.caseStudy],
  ),
  strengthSignals: [
    {
      title: "Delivery Excellence",
      summary:
        "Release and delivery improvements are documented with concrete numbers in the cited records.",
      confidence: "high",
      // One fabricated ref on purpose: validation must drop it and add a note.
      evidence: [...cite(ref.experience, ref.caseStudy), { ref: "project:totally-invented" }],
    },
    {
      title: "Product-Minded Engineering",
      summary: "Projects pair technical depth with end-user-facing product framing.",
      confidence: "medium",
      evidence: cite(ref.project),
    },
  ],
  blindSpots: [
    {
      title: "Architecture Visibility",
      summary:
        "System-level decision narratives are thinner than delivery narratives in the published set.",
      impact: "Readers see outcomes but less of the architectural reasoning behind them.",
      recommendation:
        "Expand the cited case study with the architecture decisions that produced the outcome.",
      confidence: "medium",
      evidence: cite(ref.caseStudy),
    },
  ],
  careerTrajectory: {
    stages: [
      {
        title: "Execution-Focused Engineer",
        timeframe: "Early records",
        explanation: "Earlier records emphasize hands-on delivery within a team scope.",
        evidence: cite(ref.experience),
      },
      {
        title: "Systems Builder",
        timeframe: "Recent records",
        explanation: "Recent records show end-to-end ownership of platforms and tooling.",
        evidence: cite(ref.project, ref.caseStudy),
      },
    ],
  },
  recruiterSimulation: {
    recruiter: statement("Clear role progression with named outcomes that scan quickly.", [
      ref.experience,
    ]),
    hiringManager: statement("Evidence of reliable delivery and measurable team-level impact.", [
      ref.caseStudy,
    ]),
    staffEngineer: statement("Tooling and platform work shows systems thinking beyond tickets.", [
      ref.project,
    ]),
    startupFounder: statement("Breadth across product and infrastructure suits small teams.", [
      ref.project,
      ref.experience,
    ]),
  },
  opportunityHeatmap: [
    {
      opportunity: "Document architecture decisions",
      expectedImpact: "high",
      estimatedEffort: "medium",
      recommendation: "Add an architecture section to the strongest case study.",
      evidence: cite(ref.caseStudy),
    },
  ],
  homePageContent: {
    eyebrow: "AI Portfolio Insight",
    headline: "Delivery ownership with product-minded systems work.",
    summary:
      "A homepage summary grounded in the same published records and validated insight report.",
    primarySignals: [
      {
        title: "Delivery ownership",
        summary: "Release and delivery improvements are backed by concrete portfolio evidence.",
        confidence: "medium" as const,
        evidence: cite(ref.experience),
      },
    ],
    proofPoints: [
      {
        label: "Release signal",
        value: "85%",
        context: "Release success improvement cited from the experience record.",
        evidence: cite(ref.experience),
      },
    ],
    capabilitySnapshot: [
      {
        label: "Frontend Engineering",
        radarKey: "frontendEngineering" as const,
        summary: "Presented on the homepage; score is resolved from signalRadar.",
        evidence: cite(ref.project, ref.skill),
      },
      {
        label: "Technical Leadership",
        radarKey: "technicalLeadership" as const,
        summary: "Presented on the homepage; score is resolved from signalRadar.",
        evidence: cite(ref.experience),
      },
    ],
    cta: {
      label: "View full AI insight",
      href: "/ai-insights",
    },
  },
  groundedDataNotes: [
    "This run was generated with the mock provider for pipeline verification — scores reflect the validation caps, not a model's judgement.",
    "Signals are limited to published records; drafts are excluded by design.",
  ],
};

const promptVersion = latestInsightPromptVersion;
const prompt = getInsightPromptVersion(promptVersion).build(input);
const startedAt = new Date();

const run = await createLlmRun({
  workflow: "aiInsights",
  targetType: "portfolio",
  targetId: null,
  status: "running",
  provider: "mock",
  model: "mock-pipeline-check",
  visibleModelName: null,
  promptSource: "codeFallback",
  configSource: "envFallback",
  promptVersion,
  promptSystem: prompt.system,
  promptUser: prompt.user,
  inputSnapshot: input,
  startedAt,
});

const result = await runPortfolioInsight({
  runId: run.id,
  input,
  prompt,
  promptVersion,
  adapter: new MockAdapter({
    model: "mock-pipeline-check",
    respond: () => JSON.stringify(report),
    usage: { promptTokens: 4200, completionTokens: 1100, totalTokens: 5300 },
  }),
  store: { update: (id, patch) => updateLlmRun(id, patch, { onlyIfActive: true }) },
  logger: createInsightLogger(run.id),
  startedAt,
});

console.log(`\nrun ${run.id} → ${result.status}${result.errorStage ? ` (${result.errorStage})` : ""}`);
await closeDb();
