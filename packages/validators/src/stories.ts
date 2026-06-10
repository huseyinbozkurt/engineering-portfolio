/**
 * Shared AI-story content types, used by the db payload column, the
 * @portfolio/llm story parser, and the admin review UI. Moved here from the db
 * schema so the LLM package can stay free of database dependencies.
 */

export interface AiGeneratedStoryPart {
  id: string;
  kind:
    | "lens"
    | "principle"
    | "decisionPattern"
    | "experience"
    | "project"
    | "caseStudy"
    | "skill"
    | "tag";
  title: string;
  summary: string;
  fields: Record<string, unknown>;
  relations?: Record<string, string[] | string | null>;
  deletedAt?: string | null;
  appliedRecordId?: string | null;
}

export interface AiGeneratedLensRenameSuggestion {
  lensId: string;
  currentName: string;
  suggestedName: string;
  reason: string;
}

export interface AiGeneratedStoryPayload {
  version: 1;
  title: string;
  summary: string;
  lensRenameSuggestions?: AiGeneratedLensRenameSuggestion[];
  parts: AiGeneratedStoryPart[];
}
