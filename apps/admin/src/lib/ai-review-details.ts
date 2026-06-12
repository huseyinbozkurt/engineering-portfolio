import type { AiSuggestion } from "@portfolio/db/schema";

export interface AiReviewDetails {
  strengths: string[];
  issues: string[];
  suggestions: string[];
  validationNotes: string[];
}

export function toAiReviewDetails(items: AiSuggestion[] | null | undefined): AiReviewDetails {
  const details: AiReviewDetails = {
    strengths: [],
    issues: [],
    suggestions: [],
    validationNotes: [],
  };

  for (const item of items ?? []) {
    const bucket = normalizeBucket(item.field);

    if (bucket) {
      details[bucket].push(item.suggestion);
    }
  }

  return details;
}

function normalizeBucket(field: string): keyof AiReviewDetails | null {
  if (field === "strengths" || field === "issues" || field === "suggestions") {
    return field;
  }

  if (field === "validationNotes" || field === "validation_notes" || field === "validation") {
    return "validationNotes";
  }

  return null;
}
