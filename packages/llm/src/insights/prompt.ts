import { PORTFOLIO_INSIGHT_RESPONSE_SCHEMA } from "@portfolio/validators";

/**
 * Compact output contract available to DB-managed prompts as
 * `{{responseShape}}`. Prompt instructions and versioning live exclusively in
 * `llm_prompt_versions`.
 */
export function getInsightResponseShape(): string {
  return PORTFOLIO_INSIGHT_RESPONSE_SCHEMA;
}
