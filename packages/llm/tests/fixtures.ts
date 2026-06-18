import type {
  EvidenceRef,
  PortfolioInsightInput,
  PortfolioInsightOutput,
} from "@portfolio/validators";

import type { InsightSource } from "../src/insights/input";

/** Refs issued by `buildPortfolioInsightInput` for the fixture source below. */
export const REFS = {
  experience: "experience:acme-senior-engineer",
  project: "project:release-dashboard",
  caseStudy: "case-study:payments-reliability",
  skill: "skill:typescript",
  lens: "lens:build-product",
  principle: "principle:simplify",
} as const;

export function makeInput(): PortfolioInsightInput {
  const counts = {
    lenses: 1,
    principles: 1,
    decisionPatterns: 0,
    experiences: 1,
    projects: 1,
    caseStudies: 1,
    skills: 1,
    tags: 0,
  };

  return {
    meta: {
      generatedAt: "2026-06-10T00:00:00.000Z",
      scope: "published-only",
      totals: counts,
      draftCounts: { ...counts, lenses: 0, principles: 0, experiences: 0, projects: 2, caseStudies: 1, skills: 0 },
    },
    records: {
      lenses: [
        { ref: REFS.lens, type: "lens", title: "Build Product", summary: "Product-minded engineering." },
      ],
      principles: [
        { ref: REFS.principle, type: "principle", title: "Simplify", summary: "Reduce complexity first." },
      ],
      decisionPatterns: [],
      experiences: [
        {
          ref: REFS.experience,
          type: "experience",
          title: "Senior Engineer at Acme",
          role: "Senior Engineer",
          startDate: "2019-01-01",
          endDate: "2023-06-01",
          summary: "Led release engineering. Improved release success from 35% to 85%.",
          outcomes: ["Improved release success from 35% to 85%."],
        },
      ],
      projects: [
        {
          ref: REFS.project,
          type: "project",
          title: "Release Dashboard",
          summary: "Internal dashboard for release health.",
          technologies: ["TypeScript", "Next.js"],
        },
      ],
      caseStudies: [
        {
          ref: REFS.caseStudy,
          type: "case-study",
          title: "Payments Reliability",
          summary: "Stabilized payment pipeline outcomes with staged rollouts.",
        },
      ],
      skills: [{ ref: REFS.skill, type: "skill", title: "TypeScript", category: "Languages", summary: "" }],
      tags: [],
    },
  };
}

export function evidence(...refs: string[]): EvidenceRef[] {
  return refs.map((ref) => ({ ref }));
}

/** A fully schema-valid output citing only fixture refs. */
export function makeOutput(overrides: Partial<PortfolioInsightOutput> = {}): PortfolioInsightOutput {
  const statement = (refs: string[]) => ({
    summary: "Grounded statement derived from the cited records.",
    confidence: "medium" as const,
    evidence: evidence(...refs),
  });

  return {
    executiveSummary: statement([REFS.experience, REFS.caseStudy]),
    strengthSignals: [
      {
        title: "Delivery Excellence",
        summary: "Release success improvements are documented across roles.",
        confidence: "high",
        evidence: evidence(REFS.experience, REFS.caseStudy),
      },
      {
        title: "Frontend Expertise",
        summary: "TypeScript-centric product work appears in projects.",
        confidence: "medium",
        evidence: evidence(REFS.project),
      },
    ],
    blindSpots: [
      {
        title: "Architecture Visibility",
        summary: "Architecture narratives are thin relative to delivery records.",
        impact: "Readers cannot see system-level decision making.",
        recommendation: "Expand the existing case study with architecture context.",
        confidence: "medium",
        evidence: evidence(REFS.caseStudy),
      },
    ],
    careerTrajectory: {
      stages: [
        {
          title: "Execution-Focused Engineer",
          timeframe: "2019-2021",
          explanation: "Early records emphasize hands-on delivery.",
          evidence: evidence(REFS.experience),
        },
        {
          title: "Systems Builder",
          timeframe: "2021-2023",
          explanation: "Later records show platform and tooling ownership.",
          evidence: evidence(REFS.project, REFS.caseStudy),
        },
      ],
    },
    recruiterSimulation: {
      recruiter: statement([REFS.experience]),
      hiringManager: statement([REFS.caseStudy]),
      staffEngineer: statement([REFS.project]),
      startupFounder: statement([REFS.experience, REFS.project]),
    },
    opportunityHeatmap: [
      {
        opportunity: "Document architecture decisions",
        expectedImpact: "high",
        estimatedEffort: "medium",
        recommendation: "Add an architecture section to the payments case study.",
        evidence: evidence(REFS.caseStudy),
      },
    ],
    groundedDataNotes: ["Leadership signals originate from a single employer's records."],
    homePageContent: {
      eyebrow: "AI Portfolio Insight",
      headline: "Evidence-backed delivery and systems signal.",
      summary: "Homepage-ready summary grounded in the same validated report.",
      primarySignals: [
        {
          title: "Delivery signal",
          summary: "Release success improvements are supported by the cited experience.",
          confidence: "medium",
          evidence: evidence(REFS.experience),
        },
      ],
      proofPoints: [
        {
          label: "Release success",
          value: "85%",
          context: "Release success improved in the cited experience.",
          evidence: evidence(REFS.experience),
        },
      ],
      capabilitySnapshot: [
        {
          label: "Frontend Engineering",
          radarKey: "frontendEngineering",
          summary: "Product UI and TypeScript evidence support this homepage card.",
          evidence: evidence(REFS.project, REFS.skill),
        },
        {
          label: "Technical Leadership",
          radarKey: "technicalLeadership",
          summary: "Leadership presentation copy is backed by the experience record.",
          evidence: evidence(REFS.experience),
        },
      ],
      cta: {
        label: "View full AI insight",
        href: "/ai-insights",
      },
    },
    ...overrides,
  };
}

/** Minimal InsightSource for input-normalization tests. */
export function makeSource(): InsightSource {
  const zeroCounts = {
    lenses: 0,
    principles: 0,
    decisionPatterns: 0,
    experiences: 0,
    projects: 0,
    caseStudies: 0,
    skills: 0,
    tags: 0,
  };

  return {
    lenses: [{ id: "l1", slug: "build-product", name: "Build Product", summary: "Product lens." }],
    principles: [
      { id: "p1", slug: "simplify", title: "Simplify", summary: "Less is more.", body: "Cut scope." },
    ],
    decisionPatterns: [],
    experiences: [
      {
        id: "e1",
        slug: "acme-senior-engineer",
        company: "Acme",
        role: "Senior Engineer",
        startDate: "2019-01-01",
        endDate: null,
        isCurrent: true,
        summary: "Improved release success from 35% to 85% over two years. Mentored four engineers.",
        awards: "Excellent Engineer Award 2022\nTop Performer",
      },
    ],
    projects: [
      {
        id: "pr1",
        slug: "release-dashboard",
        name: "Release Dashboard",
        description: "Cut release verification time by 60%. A dashboard for release health.",
        developmentTechStack: "- Next.js 16\n- TypeScript",
        qaTechStack: "* Playwright",
        aiIntegrationTechStack: "",
        deploymentTechStack: "1. AWS ECS",
        experienceId: "e1",
      },
    ],
    caseStudies: [
      {
        id: "cs1",
        slug: "payments-reliability",
        title: "Payments Reliability",
        excerpt: "Stabilizing payments.",
        context: "High failure rate.",
        problem: "Flaky rollouts.",
        action: "Introduced staged rollouts.",
        outcome: "Failure rate dropped 4x within 3 months. Team confidence recovered.",
        learning: "Process beats heroics.",
      },
    ],
    skills: [{ id: "s1", slug: "typescript", name: "TypeScript", category: "Languages" }],
    tags: [],
    draftCounts: { ...zeroCounts, projects: 2 },
    relations: {
      experienceLenses: [{ left: "e1", right: "l1" }],
      experiencePrinciples: [{ left: "e1", right: "p1" }],
      experienceSkills: [{ left: "e1", right: "s1" }],
      experienceTags: [],
      projectLenses: [],
      projectPrinciples: [],
      projectSkills: [{ left: "pr1", right: "s1" }],
      projectTags: [],
      caseStudyLenses: [],
      caseStudyPrinciples: [{ left: "cs1", right: "p1" }],
      caseStudyExperiences: [{ left: "cs1", right: "e1" }],
      caseStudyProjects: [{ left: "cs1", right: "pr1" }],
      caseStudySkills: [{ left: "cs1", right: "missing-skill" }],
      caseStudyTags: [],
      decisionPatternPrinciples: [],
    },
  };
}
