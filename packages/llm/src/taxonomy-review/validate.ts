import {
  taxonomyReviewOutputSchema,
  type TaxonomyEvidenceRef,
  type TaxonomyReviewInput,
  type TaxonomyReviewOutput,
  type TaxonomySuggestion,
} from "@portfolio/validators";
import { ZodError } from "zod";

export type TaxonomyReviewValidationStage = "json" | "schema" | "evidence";

export class TaxonomyReviewValidationError extends Error {
  constructor(
    public readonly stage: TaxonomyReviewValidationStage,
    message: string,
  ) {
    super(message);
    this.name = "TaxonomyReviewValidationError";
  }
}

export interface ValidatedTaxonomyReview {
  output: TaxonomyReviewOutput;
  notes: string[];
}

export function collectTaxonomyPrimaryRefs(
  input: TaxonomyReviewInput,
): Set<string> {
  const refs = new Set<string>();
  for (const records of Object.values(input.primaryRecords)) {
    for (const record of records) {
      refs.add(refKey(record.ref));
    }
  }
  return refs;
}

export function validateTaxonomyReviewOutput(
  rawText: string,
  input: TaxonomyReviewInput,
): ValidatedTaxonomyReview {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(extractJson(rawText));
  } catch (error) {
    throw new TaxonomyReviewValidationError(
      "json",
      error instanceof Error ? error.message : "Response was not valid JSON.",
    );
  }

  let output: TaxonomyReviewOutput;
  try {
    output = taxonomyReviewOutputSchema.parse(parsedJson);
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues
        .slice(0, 4)
        .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join("; ");
      throw new TaxonomyReviewValidationError(
        "schema",
        `Output failed schema validation - ${issues}`,
      );
    }
    throw new TaxonomyReviewValidationError("schema", "Output failed schema validation.");
  }

  const validRefs = collectTaxonomyPrimaryRefs(input);
  const notes: string[] = [];
  const deduped = new Set<string>();
  const suggestions: TaxonomySuggestion[] = [];

  for (const suggestion of output.suggestions) {
    const evidenceRefs = keepValidRefs(
      suggestion.evidenceRefs,
      validRefs,
      `suggestion ${suggestion.action} ${suggestion.targetGroup}`,
      notes,
    );

    if (evidenceRefs.length === 0) {
      notes.push(
        `Removed ${suggestion.action} suggestion for ${suggestion.targetGroup}: no valid primary evidence refs remained.`,
      );
      continue;
    }

    const affectedRecords = keepValidRefs(
      suggestion.affectedRecords ?? [],
      validRefs,
      `affectedRecords ${suggestion.action} ${suggestion.targetGroup}`,
      notes,
    );
    const key = [
      suggestion.targetGroup,
      suggestion.action,
      normalizeValue(suggestion.currentValue),
      normalizeValue(suggestion.proposedValue),
    ].join("|");

    if (deduped.has(key)) {
      notes.push(`Removed duplicate ${suggestion.action} suggestion for ${suggestion.targetGroup}.`);
      continue;
    }

    deduped.add(key);
    suggestions.push({
      ...suggestion,
      evidenceRefs,
      affectedRecords,
    });
  }

  return {
    output: { suggestions },
    notes,
  };
}

function keepValidRefs(
  refs: TaxonomyEvidenceRef[],
  validRefs: Set<string>,
  where: string,
  notes: string[],
): TaxonomyEvidenceRef[] {
  const kept: TaxonomyEvidenceRef[] = [];
  const seen = new Set<string>();

  for (const ref of refs) {
    const key = refKey(ref);
    if (!validRefs.has(key)) {
      notes.push(`Dropped evidence "${key}" on ${where}: no matching primary record.`);
      continue;
    }
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    kept.push(ref);
  }

  return kept.slice(0, 8);
}

function refKey(ref: Pick<TaxonomyEvidenceRef, "type" | "id">): string {
  return `${ref.type}:${ref.id}`;
}

function normalizeValue(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
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
