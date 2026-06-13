import { ZodError } from "zod";

import {
  experienceAiReviewOutputSchema,
  type ExperienceAiReviewOutput,
} from "@portfolio/validators";

export const experienceAiReviewTaskType = "experience_ai_review";
export const projectAiReviewTaskType = "project_ai_review";
export const caseStudyAiReviewTaskType = "case_study_ai_review";
export const latestExperienceAiReviewPromptVersion = "experience-ai-review-v1";
export const latestContentAiReviewPromptVersion = "content-ai-review-v1";

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

export function buildExperienceAiReviewPrompt(input: ExperienceAiReviewInput): {
  system: string;
  user: string;
} {
  return buildContentAiReviewPrompt({
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
  });
}

export function buildContentAiReviewPrompt(input: ContentAiReviewInput): {
  system: string;
  user: string;
} {
  return {
    system: [
      "You are an editorial reviewer for a software engineering portfolio CMS.",
      "Analyze only the single content record provided by the user.",
      "Do not invent achievements, metrics, employers, dates, responsibilities, outcomes, tools, or claims.",
      "If the record is incomplete, say so plainly.",
      "Suggestions must be editorial or structural improvements only, never fake career claims.",
      "Return strict JSON only. Do not include markdown, prose outside JSON, or code fences.",
      `Current date: ${new Date().toISOString().split("T")[0]} Do not flag future/past dates. Date validation is handled by the application.`,
      "If an awards field is present, it may contain unstructured text about awards, recognitions, or accomplishments. Extract only grounded strengths from it, and do not infer or assume any specific awards if not explicitly stated.",
      "if the type of record is project and it's not open source it should not have gitHub url present, if it's incomplete it should not have url and end date field present"
    ].join("\n"),
    user: JSON.stringify(
      {
        task: `Review this ${input.entityType.replace("_", " ")} record for admin-only editorial quality metadata.`,
        outputShape: {
          qualityScore: "integer from 0 to 100",
          summary: "short, useful admin review summary",
          strengths: "array of grounded strengths in the existing record",
          issues: "array of grounded content gaps or risks",
          suggestions: "array of editorial/structural suggestions only",
        },
        rules: [
          "Ground every observation in the provided record.",
          "Do not imply missing information is true.",
          "Do not add new metrics, accomplishments, technologies, employers, or outcomes.",
          "Lower the score for incomplete or thin drafts.",
        ],
        record: input,
      },
      null,
      2,
    ),
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
