import { z } from "zod";

/**
 * Evidence-driven AI insight schemas.
 *
 * `PortfolioInsightInput` is the compact, normalized snapshot of *published*
 * portfolio records sent to the LLM (never raw DB rows). Every record carries a
 * stable `ref` (`{type}:{slug-or-id}`) that the model must cite as evidence.
 *
 * `PortfolioInsightOutput` is the strict report contract. Objects are `.strict()`
 * so unexpected keys are rejected, never silently accepted. The validation
 * pipeline in `@portfolio/llm` additionally verifies that every evidence ref
 * exists in the input and enforces confidence rules — the schema alone is
 * necessary but not sufficient.
 */

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export const insightConfidenceSchema = z.enum(["low", "medium", "high"]);
export type InsightConfidence = z.infer<typeof insightConfidenceSchema>;

export const evidenceRefSchema = z
  .object({
    /** Stable record reference issued by the input normalizer, e.g. "experience:huawei-team-lead". */
    ref: z.string().trim().min(1).max(160),
    /** Optional short note on what this record evidences. */
    note: z.string().trim().min(1).max(240).optional(),
  })
  .strict();
export type EvidenceRef = z.infer<typeof evidenceRefSchema>;

const evidenceListSchema = z.array(evidenceRefSchema).max(6);
const requiredEvidenceListSchema = z.array(evidenceRefSchema).min(1).max(6);

const shortTextSchema = z.string().trim().min(1).max(220);
const summaryTextSchema = z.string().trim().min(1).max(700);

// ---------------------------------------------------------------------------
// Input snapshot
// ---------------------------------------------------------------------------

export const insightRecordTypeSchema = z.enum([
  "lens",
  "principle",
  "decision-pattern",
  "experience",
  "project",
  "case-study",
  "skill",
  "tag",
]);
export type InsightRecordType = z.infer<typeof insightRecordTypeSchema>;

export const portfolioInsightRecordSchema = z
  .object({
    ref: z.string().trim().min(1).max(160),
    type: insightRecordTypeSchema,
    title: z.string().trim().min(1).max(220),
    category: z.string().trim().min(1).max(120).optional(),
    tags: z.array(z.string().trim().min(1).max(80)).max(24).optional(),
    role: z.string().trim().min(1).max(180).optional(),
    startDate: z.string().trim().min(1).max(40).optional(),
    endDate: z.string().trim().min(1).max(40).optional(),
    isCurrent: z.boolean().optional(),
    /** Compacted summary text — never full rich-text bodies. */
    summary: z.string().trim().max(900),
    /** Measurable-outcome lines extracted from the record (numbers, %, awards). */
    outcomes: z.array(z.string().trim().min(1).max(240)).max(8).optional(),
    /** Technology signals (skill names, stack mentions). */
    technologies: z.array(z.string().trim().min(1).max(80)).max(24).optional(),
    awards: z.array(z.string().trim().min(1).max(240)).max(6).optional(),
    /** Refs of explicitly related records (joins), e.g. a case study's projects. */
    relatedRefs: z.array(z.string().trim().min(1).max(160)).max(40).optional(),
  })
  .strict();
export type PortfolioInsightRecord = z.infer<typeof portfolioInsightRecordSchema>;

const insightRecordCountsSchema = z
  .object({
    lenses: z.number().int().min(0),
    principles: z.number().int().min(0),
    decisionPatterns: z.number().int().min(0),
    experiences: z.number().int().min(0),
    projects: z.number().int().min(0),
    caseStudies: z.number().int().min(0),
    skills: z.number().int().min(0),
    tags: z.number().int().min(0),
  })
  .strict();
export type InsightRecordCounts = z.infer<typeof insightRecordCountsSchema>;

export const portfolioInsightInputSchema = z
  .object({
    meta: z
      .object({
        generatedAt: z.string().trim().min(1),
        /** Only published records are included; drafts appear solely as counts. */
        scope: z.literal("published-only"),
        totals: insightRecordCountsSchema,
        draftCounts: insightRecordCountsSchema,
      })
      .strict(),
    records: z
      .object({
        lenses: z.array(portfolioInsightRecordSchema).max(40),
        principles: z.array(portfolioInsightRecordSchema).max(60),
        decisionPatterns: z.array(portfolioInsightRecordSchema).max(60),
        experiences: z.array(portfolioInsightRecordSchema).max(60),
        projects: z.array(portfolioInsightRecordSchema).max(80),
        caseStudies: z.array(portfolioInsightRecordSchema).max(80),
        skills: z.array(portfolioInsightRecordSchema).max(160),
        tags: z.array(portfolioInsightRecordSchema).max(160),
      })
      .strict(),
  })
  .strict();
export type PortfolioInsightInput = z.infer<typeof portfolioInsightInputSchema>;

// ---------------------------------------------------------------------------
// Output report
// ---------------------------------------------------------------------------

export const insightStatementSchema = z
  .object({
    summary: summaryTextSchema,
    confidence: insightConfidenceSchema,
    evidence: requiredEvidenceListSchema,
  })
  .strict();
export type InsightStatement = z.infer<typeof insightStatementSchema>;

export const strengthSignalSchema = z
  .object({
    title: shortTextSchema,
    summary: summaryTextSchema,
    confidence: insightConfidenceSchema,
    evidence: requiredEvidenceListSchema,
  })
  .strict();
export type StrengthSignal = z.infer<typeof strengthSignalSchema>;

/**
 * Blind spots describe presentation gaps. Unlike strengths, evidence may be
 * empty (a gap can be the *absence* of records) — the validation pipeline then
 * forces confidence to "low" instead of removing the item.
 */
export const blindSpotSchema = z
  .object({
    title: shortTextSchema,
    summary: summaryTextSchema,
    impact: summaryTextSchema,
    recommendation: summaryTextSchema,
    confidence: insightConfidenceSchema,
    evidence: evidenceListSchema,
  })
  .strict();
export type BlindSpot = z.infer<typeof blindSpotSchema>;

export const trajectoryStageSchema = z
  .object({
    title: shortTextSchema,
    timeframe: z.string().trim().min(1).max(80),
    explanation: summaryTextSchema,
    evidence: requiredEvidenceListSchema,
  })
  .strict();
export type TrajectoryStage = z.infer<typeof trajectoryStageSchema>;

export const recruiterSimulationSchema = z
  .object({
    recruiter: insightStatementSchema,
    hiringManager: insightStatementSchema,
    staffEngineer: insightStatementSchema,
    startupFounder: insightStatementSchema,
  })
  .strict();
export type RecruiterSimulation = z.infer<typeof recruiterSimulationSchema>;

export const opportunityLevelSchema = z.enum(["low", "medium", "high"]);
export type OpportunityLevel = z.infer<typeof opportunityLevelSchema>;

export const opportunitySchema = z
  .object({
    opportunity: shortTextSchema,
    expectedImpact: opportunityLevelSchema,
    estimatedEffort: opportunityLevelSchema,
    recommendation: summaryTextSchema,
    evidence: evidenceListSchema,
  })
  .strict();
export type Opportunity = z.infer<typeof opportunitySchema>;

export const signalAxisSchema = z
  .object({
    score: z.number().int().min(0).max(100),
    evidence: evidenceListSchema,
  })
  .strict();
export type SignalAxis = z.infer<typeof signalAxisSchema>;

export const signalRadarKeySchema = z.enum([
  "frontendEngineering",
  "technicalLeadership",
  "systemDesign",
  "devopsCloud",
  "aiEngineering",
  "peopleManagement",
]);
export type SignalRadarKey = z.infer<typeof signalRadarKeySchema>;

export const signalRadarSchema = z
  .object({
    frontendEngineering: signalAxisSchema,
    technicalLeadership: signalAxisSchema,
    systemDesign: signalAxisSchema,
    devopsCloud: signalAxisSchema,
    aiEngineering: signalAxisSchema,
    peopleManagement: signalAxisSchema,
  })
  .strict();
export type SignalRadar = z.infer<typeof signalRadarSchema>;

export const SIGNAL_RADAR_LABELS: Record<SignalRadarKey, string> = {
  frontendEngineering: "Frontend Engineering",
  technicalLeadership: "Technical Leadership",
  systemDesign: "System Design",
  devopsCloud: "DevOps & Cloud",
  aiEngineering: "AI Engineering",
  peopleManagement: "People Management",
};


export const homePageSignalSchema = z
  .object({
    title: z.string().trim().min(1).max(80),
    summary: z.string().trim().min(1).max(250),
    confidence: insightConfidenceSchema,
    evidence: evidenceListSchema
  })
  .strict();

export const homePageProofPointSchema = z
  .object({
    label: z.string().trim().min(1).max(60),
    value: z.string().trim().min(1).max(60),
    context: z.string().trim().min(1).max(180),
    evidence: evidenceListSchema
  })
  .strict();

export const homePageCapabilitySchema = z
  .object({
    label: z.string().trim().min(1).max(60),
    radarKey: signalRadarKeySchema.optional(),
    /** Legacy field accepted for older reports. UI must derive scores from signalRadar. */
    score: z.number().int().min(0).max(100).optional(),
    summary: z.string().trim().min(1).max(180),
    evidence: evidenceListSchema
  })
  .strict();

export const homePageContentSchema = z
  .object({
    eyebrow: z.string().trim().min(1).max(50),
    headline: z.string().trim().min(1).max(140),
    summary: z.string().trim().min(1).max(350),

    primarySignals: z.array(homePageSignalSchema).min(1).max(3),
    proofPoints: z.array(homePageProofPointSchema).min(1).max(4),
    capabilitySnapshot: z.array(homePageCapabilitySchema).min(1).max(6),

    cta: z
      .object({
        label: z.string().trim().min(1).max(60),
        href: z.string().trim().min(1).max(200),
      })
      .strict(),
  })
  .strict();

export type HomePageSignal = z.infer<typeof homePageSignalSchema>;
export type HomePageProofPoint = z.infer<typeof homePageProofPointSchema>;
export type HomePageCapability = z.infer<typeof homePageCapabilitySchema>;
export type HomePageContent = z.infer<typeof homePageContentSchema>;

export const portfolioInsightOutputSchema = z
  .object({
    executiveSummary: insightStatementSchema,
    strengthSignals: z.array(strengthSignalSchema).min(1).max(6),
    blindSpots: z.array(blindSpotSchema).min(1).max(6),
    careerTrajectory: z
      .object({ stages: z.array(trajectoryStageSchema).min(2).max(6) })
      .strict(),
    recruiterSimulation: recruiterSimulationSchema,
    opportunityHeatmap: z.array(opportunitySchema).min(1).max(8),
    signalRadar: signalRadarSchema,
    groundedDataNotes: z.array(z.string().trim().min(1).max(300)).min(1).max(8),
    homePageContent: homePageContentSchema.optional(),
  })
  .strict();
export type PortfolioInsightOutput = z.infer<typeof portfolioInsightOutputSchema>;

// ---------------------------------------------------------------------------
// Run lifecycle
// ---------------------------------------------------------------------------

export const aiInsightRunStatusSchema = z.enum([
  "pending",
  "running",
  "succeeded",
  "failed",
  "published",
]);
export type AiInsightRunStatus = z.infer<typeof aiInsightRunStatusSchema>;

export const insightTokenUsageSchema = z
  .object({
    promptTokens: z.number().int().min(0).optional(),
    completionTokens: z.number().int().min(0).optional(),
    totalTokens: z.number().int().min(0).optional(),
  })
  .strict();
export type InsightTokenUsage = z.infer<typeof insightTokenUsageSchema>;
