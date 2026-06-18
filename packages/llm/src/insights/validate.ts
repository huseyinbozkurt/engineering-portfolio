import {
  portfolioInsightOutputSchema,
  type EvidenceRef,
  type InsightConfidence,
  type PortfolioInsightInput,
  type PortfolioInsightOutput,
} from "@portfolio/validators";
import { ZodError } from "zod";

/**
 * Staged validation of a raw LLM response against the input snapshot.
 *
 *  1. json     — extract + parse strict JSON (reject markdown wrappers, truncation).
 *  2. schema   — `portfolioInsightOutputSchema.parse` (reject, never coerce).
 *  3. evidence — every evidence ref must exist in the input snapshot; unknown
 *                refs are dropped; claims left unsupported are removed (or, for
 *                gap-style sections, downgraded to low confidence); confidence
 *                levels are clamped to what the surviving evidence can carry.
 *
 * Unsupported claims never survive. Every mutation is recorded as a
 * human-readable note persisted with the run for the admin debug view.
 */

export type InsightValidationStage = "json" | "schema" | "evidence";

export class InsightValidationError extends Error {
  constructor(
    public readonly stage: InsightValidationStage,
    message: string,
  ) {
    super(message);
    this.name = "InsightValidationError";
  }
}

export interface ValidatedInsight {
  output: PortfolioInsightOutput;
  notes: string[];
}

export interface ValidateInsightOutputOptions {
  requireHomePageContent?: boolean;
}

/**
 * Homepage-content rules enforced on top of the Zod schema for the active DB
 * prompt: `homePageContent` must exist, every
 * `capabilitySnapshot` item must carry a `radarKey`, and none may carry a legacy
 * `score`. Returns a human-readable violation message, or `null` when the rules
 * pass. Shared by the runner's validation path and the insight cache, which must
 * not serve a cached output that no longer satisfies the current homepage rules.
 */
export function homePageContentRuleViolation(output: PortfolioInsightOutput): string | null {
  if (!output.homePageContent) {
    return "Output failed schema validation — homePageContent is required for the current prompt version.";
  }

  const missingRadarKey = output.homePageContent.capabilitySnapshot.find(
    (capability) => !capability.radarKey,
  );
  if (missingRadarKey) {
    return `Output failed schema validation — homePageContent.capabilitySnapshot "${missingRadarKey.label}" must include radarKey.`;
  }

  const duplicatedScore = output.homePageContent.capabilitySnapshot.find(
    (capability) => capability.score !== undefined,
  );
  if (duplicatedScore) {
    return `Output failed schema validation — homePageContent.capabilitySnapshot "${duplicatedScore.label}" must not include score; use radarKey instead.`;
  }

  return null;
}

/** All refs issued by the input normalizer — the only legal evidence targets. */
export function collectInputRefs(input: PortfolioInsightInput): Set<string> {
  const refs = new Set<string>();
  for (const records of Object.values(input.records)) {
    for (const record of records) {
      refs.add(record.ref);
    }
  }
  return refs;
}

export function validateInsightOutput(
  rawText: string,
  input: PortfolioInsightInput,
  options: ValidateInsightOutputOptions = {},
): ValidatedInsight {
  // Stage 1 — JSON.
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(extractJson(rawText));
  } catch (error) {
    throw new InsightValidationError(
      "json",
      error instanceof Error ? error.message : "Response was not valid JSON.",
    );
  }

  // Stage 2 — schema (strict; unknown keys and wrong shapes are rejected).
  let output: PortfolioInsightOutput;
  try {
    output = portfolioInsightOutputSchema.parse(parsedJson);
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues
        .slice(0, 3)
        .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join("; ");
      throw new InsightValidationError("schema", `Output failed schema validation — ${issues}`);
    }
    throw new InsightValidationError("schema", "Output failed schema validation.");
  }

  if (options.requireHomePageContent) {
    const violation = homePageContentRuleViolation(output);
    if (violation) {
      throw new InsightValidationError("schema", violation);
    }
  }

  // Stage 3 — evidence + confidence enforcement.
  const refs = collectInputRefs(input);
  const notes: string[] = [];

  const keepValid = (evidence: EvidenceRef[], where: string): EvidenceRef[] => {
    const valid: EvidenceRef[] = [];
    for (const entry of evidence) {
      if (refs.has(entry.ref)) {
        valid.push(entry);
      } else {
        notes.push(`Dropped evidence "${entry.ref}" on ${where}: no matching record in the input snapshot.`);
      }
    }
    return valid;
  };

  const enforceConfidence = (
    confidence: InsightConfidence,
    evidenceCount: number,
    where: string,
  ): InsightConfidence => {
    const ceiling: InsightConfidence =
      evidenceCount >= 2 ? "high" : evidenceCount === 1 ? "medium" : "low";
    if (rank(confidence) > rank(ceiling)) {
      notes.push(
        `Downgraded confidence on ${where} from "${confidence}" to "${ceiling}" (${evidenceCount} supporting record${evidenceCount === 1 ? "" : "s"}).`,
      );
      return ceiling;
    }
    return confidence;
  };

  // Executive summary + recruiter views: keep, but confidence reflects evidence.
  const enforceStatement = <T extends { confidence: InsightConfidence; evidence: EvidenceRef[] }>(
    statement: T,
    where: string,
  ): T => {
    const evidence = keepValid(statement.evidence, where);
    return {
      ...statement,
      evidence,
      confidence: enforceConfidence(statement.confidence, evidence.length, where),
    };
  };

  const executiveSummary = enforceStatement(output.executiveSummary, "executiveSummary");

  // Strength signals: claims about the engineer — zero valid evidence removes the claim.
  const strengthSignals = output.strengthSignals.flatMap((signal) => {
    const where = `strengthSignals "${signal.title}"`;
    const evidence = keepValid(signal.evidence, where);
    if (evidence.length === 0) {
      notes.push(`Removed ${where}: no valid supporting evidence.`);
      return [];
    }
    return [
      {
        ...signal,
        evidence,
        confidence: enforceConfidence(signal.confidence, evidence.length, where),
      },
    ];
  });
  if (strengthSignals.length === 0) {
    throw new InsightValidationError(
      "evidence",
      "Every strength signal lost its evidence — the report cannot be trusted.",
    );
  }

  // Blind spots: presentation gaps — absence claims may carry no evidence, but
  // then they cannot claim more than low confidence.
  const blindSpots = output.blindSpots.map((spot) => {
    const where = `blindSpots "${spot.title}"`;
    const evidence = keepValid(spot.evidence, where);
    return {
      ...spot,
      evidence,
      confidence: enforceConfidence(spot.confidence, evidence.length, where),
    };
  });

  // Trajectory stages: each stage must keep at least one supporting record.
  const stages = output.careerTrajectory.stages.flatMap((stage) => {
    const where = `careerTrajectory "${stage.title}"`;
    const evidence = keepValid(stage.evidence, where);
    if (evidence.length === 0) {
      notes.push(`Removed ${where}: no valid supporting evidence.`);
      return [];
    }
    return [{ ...stage, evidence }];
  });
  if (stages.length < 2) {
    throw new InsightValidationError(
      "evidence",
      "Career trajectory lost too many stages to evidence validation (fewer than 2 remain).",
    );
  }

  const recruiterSimulation = {
    recruiter: enforceStatement(output.recruiterSimulation.recruiter, "recruiterSimulation.recruiter"),
    hiringManager: enforceStatement(
      output.recruiterSimulation.hiringManager,
      "recruiterSimulation.hiringManager",
    ),
    staffEngineer: enforceStatement(
      output.recruiterSimulation.staffEngineer,
      "recruiterSimulation.staffEngineer",
    ),
    startupFounder: enforceStatement(
      output.recruiterSimulation.startupFounder,
      "recruiterSimulation.startupFounder",
    ),
  };

  // Opportunities: keep (they are recommendations, not claims), evidence filtered.
  const opportunityHeatmap = output.opportunityHeatmap.map((item) => {
    const where = `opportunityHeatmap "${item.opportunity}"`;
    const evidence = keepValid(item.evidence, where);
    if (evidence.length === 0 && item.evidence.length > 0) {
      notes.push(`${where} retained without evidence after validation.`);
    }
    return { ...item, evidence };
  });

  const homePageContent = {
        ...output.homePageContent,
        primarySignals: output.homePageContent.primarySignals.map((signal) => {
          const where = `homePageContent.primarySignals "${signal.title}"`;
          const evidence = keepValid(signal.evidence, where);
          return {
            ...signal,
            evidence,
            confidence: enforceConfidence(signal.confidence, evidence.length, where),
          };
        }),
        proofPoints: output.homePageContent.proofPoints.map((proof) => ({
          ...proof,
          evidence: keepValid(proof.evidence, `homePageContent.proofPoints "${proof.label}"`),
        })),
        capabilitySnapshot: output.homePageContent.capabilitySnapshot.map((capability) => ({
          ...capability,
          evidence: keepValid(
            capability.evidence,
            `homePageContent.capabilitySnapshot "${capability.label}"`,
          ),
        })),
      };

  return {
    output: {
      executiveSummary,
      strengthSignals,
      blindSpots,
      careerTrajectory: { stages },
      recruiterSimulation,
      opportunityHeatmap,
      groundedDataNotes: output.groundedDataNotes,
      homePageContent,
    },
    notes,
  };
}

function rank(confidence: InsightConfidence): number {
  return confidence === "high" ? 2 : confidence === "medium" ? 1 : 0;
}

function extractJson(value: string): string {
  const trimmed = value.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Response did not contain a JSON object.");
  }

  return trimmed.slice(start, end + 1);
}
