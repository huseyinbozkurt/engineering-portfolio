import type { TaxonomyReviewInput } from "@portfolio/validators";

export interface BuiltTaxonomyReviewPrompt {
  system: string;
  user: string;
}

export interface TaxonomyReviewPromptVersion {
  version: string;
  build(input: TaxonomyReviewInput): BuiltTaxonomyReviewPrompt;
}

export const TAXONOMY_REVIEW_PROMPT_V1 = "taxonomy-review-v1";

const promptV1: TaxonomyReviewPromptVersion = {
  version: TAXONOMY_REVIEW_PROMPT_V1,
  build(input) {
    return {
      system: [
        "You are a rigorous portfolio taxonomy editor.",
        "",
        "Your job is to analyze canonical PRIMARY records and suggest improvements only for SUPPORTING taxonomy/content groups.",
        "",
        "PRIMARY RECORDS - SOURCE OF TRUTH:",
        "- experiences",
        "- caseStudies",
        "- projects",
        "",
        "SUPPORTING GROUPS YOU MAY SUGGEST CHANGES FOR:",
        "- skills",
        "- tags",
        "- lenses",
        "- principles",
        "- decisionPatterns",
        "",
        "DO NOT suggest edits to experiences, caseStudies, or projects.",
        "DO NOT suggest relationship/join changes.",
        "DO NOT invent taxonomy that is not strongly implied by primary records.",
        "Prefer consistency and consolidation over adding many new items.",
        "",
        "WHAT TO DETECT:",
        "- duplicate or overlapping supporting concepts",
        "- vague supporting names that should be clearer",
        "- unused or stale supporting records, when primary evidence supports removal",
        "- missing supporting records only when strongly implied by primary evidence",
        "- inconsistent casing, naming style, or near-duplicates",
        "",
        "EVIDENCE RULES:",
        "- Every suggestion must cite evidenceRefs from primary records only.",
        "- evidenceRefs must use objects copied from primaryRecords[*].ref.",
        "- Do not cite supportingRecords as evidence.",
        "- For remove suggestions, cite primary records that show the actual stronger/nearby taxonomy signal. If no primary evidence can support the removal, omit the suggestion.",
        "- affectedRecords may repeat primary refs that would be helped or clarified by the suggestion.",
        "",
        "CONFIDENCE RULES:",
        "- high: repeated, direct support across multiple primary records or an obvious duplicate/merge with primary usage.",
        "- medium: one strong primary record or clear taxonomy cleanup with some primary support.",
        "- low: weak or ambiguous; include only when useful and still grounded.",
        "- When in doubt, lower confidence or omit the suggestion.",
        "",
        "OUTPUT RULES:",
        "- Return valid JSON only.",
        "- No markdown, commentary, warnings, or explanation outside JSON.",
        "- Match the response shape exactly.",
        "- targetGroup must be one of: skills, tags, lenses, principles, decisionPatterns.",
        "- action must be one of: add, remove, rename, merge.",
        "- add requires proposedValue.",
        "- remove requires currentValue.",
        "- rename and merge require currentValue and proposedValue.",
        "- reason must be concise and specific.",
        "- Prefer no more than 25 suggestions total unless the data clearly warrants more.",
        "",
        "Before returning, validate that all evidenceRefs exist in primaryRecords and that no suggestion targets primary records.",
      ].join("\n"),
      user: [
        "Review this portfolio taxonomy snapshot and return suggestions.",
        "",
        "RESPONSE SHAPE:",
        JSON.stringify(responseShape(), null, 2),
        "",
        "DATASET:",
        JSON.stringify(input, null, 2),
      ].join("\n"),
    };
  },
};

export const taxonomyReviewPromptVersions: Record<string, TaxonomyReviewPromptVersion> = {
  [TAXONOMY_REVIEW_PROMPT_V1]: promptV1,
};

export const latestTaxonomyReviewPromptVersion = TAXONOMY_REVIEW_PROMPT_V1;

export function getTaxonomyReviewPromptVersion(
  version: string,
): TaxonomyReviewPromptVersion {
  const entry = taxonomyReviewPromptVersions[version];
  if (!entry) {
    throw new Error(`Unknown taxonomy review prompt version: ${version}`);
  }
  return entry;
}

function responseShape(): Record<string, unknown> {
  const evidenceRef = {
    type: "experience | caseStudy | project",
    id: "id copied from primaryRecords[*].ref.id",
    title: "title copied from primaryRecords[*].ref.title",
    note: "short note about what this primary record supports",
  };

  return {
    suggestions: [
      {
        targetGroup: "skills | tags | lenses | principles | decisionPatterns",
        action: "add | remove | rename | merge",
        currentValue: "existing supporting value when applicable",
        proposedValue: "new or target supporting value when applicable",
        reason: "Evidence-grounded reason for the cleanup.",
        confidence: "low | medium | high",
        evidenceRefs: [evidenceRef],
        affectedRecords: [evidenceRef],
      },
    ],
  };
}
