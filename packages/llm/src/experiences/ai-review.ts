import { ZodError } from "zod";

import {
  experienceAiReviewOutputSchema,
  type ExperienceAiReviewOutput,
} from "@portfolio/validators";

export const experienceAiReviewTaskType = "experience_ai_review";
export const projectAiReviewTaskType = "project_ai_review";
export const caseStudyAiReviewTaskType = "case_study_ai_review";

export type ContentAiReviewEntityType = "experience" | "project" | "case_study";

export interface ExperienceAiReviewInput {
  id: string;
  status: string;
  slug: string | null;
  company: string;
  role: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  summary: string;
  details: string;
  awards: string;
}

export interface ContentAiReviewInput {
  entityType: ContentAiReviewEntityType;
  id: string;
  status: string;
  slug: string | null;
  title: string;
  fields: Record<string, unknown>;
  relations?: Record<string, string[] | string | null> | undefined;
}

/** Normalize an experience into the generic content-review record shape. */
export function experienceToContentAiReviewInput(
  input: ExperienceAiReviewInput,
): ContentAiReviewInput {
  return {
    entityType: "experience",
    id: input.id,
    status: input.status,
    slug: input.slug,
    title: [input.role, input.company].filter(Boolean).join(" at "),
    fields: {
      company: input.company,
      role: input.role,
      location: input.location,
      startDate: input.startDate,
      endDate: input.endDate,
      isCurrent: input.isCurrent,
      summary: input.summary,
      details: input.details,
      awards: input.awards,
    },
  };
}

/** The output contract the parser expects and DB templates receive as `{{responseShape}}`. */
const CONTENT_AI_REVIEW_OUTPUT_SHAPE = {
  qualityScore: "integer from 0 to 100",
  summary: "short, useful admin review summary",
  strengths: "array of grounded strengths in the existing record",
  issues: "array of grounded content gaps or risks",
  suggestions: "array of editorial/structural suggestions only",
} as const;

/**
 * The JSON output-shape contract embedded in the content-review prompt,
 * serialized. Exposed so a DB-managed `contentReview` prompt template can be
 * rendered with the same `{{responseShape}}` value the code builder uses.
 */
export function getContentReviewResponseShape(): string {
  return JSON.stringify(CONTENT_AI_REVIEW_OUTPUT_SHAPE, null, 2);
}

/**
 * Template variables for a DB-managed `contentReview` prompt, matching the
 * workflow's variable contract (`contentRecord`, `responseShape`).
 */
export function buildContentReviewVariables(input: ContentAiReviewInput): {
  contentRecord: string;
  responseShape: string;
} {
  return {
    contentRecord: JSON.stringify(input, null, 2),
    responseShape: getContentReviewResponseShape(),
  };
}

export function parseExperienceAiReviewOutput(rawText: string): ExperienceAiReviewOutput {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawText.trim());
  } catch (error) {
    throw new ExperienceAiReviewValidationError(
      "json",
      error instanceof Error ? error.message : "Response was not valid JSON.",
    );
  }

  try {
    return experienceAiReviewOutputSchema.parse(parsed);
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues
        .slice(0, 4)
        .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join("; ");
      throw new ExperienceAiReviewValidationError(
        "schema",
        `Output failed schema validation: ${issues}`,
      );
    }

    throw new ExperienceAiReviewValidationError("schema", "Output failed schema validation.");
  }
}

export class ExperienceAiReviewValidationError extends Error {
  constructor(
    public readonly stage: "json" | "schema",
    message: string,
  ) {
    super(message);
    this.name = "ExperienceAiReviewValidationError";
  }
}
