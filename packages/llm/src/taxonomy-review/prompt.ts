/**
 * Output contract available to DB-managed taxonomy-review prompts as
 * `{{responseShape}}`. Prompt instructions and versioning live exclusively in
 * `llm_prompt_versions`.
 */
export function getTaxonomyReviewResponseShape(): string {
  return JSON.stringify(responseShape(), null, 2);
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
