import { getDecisionPatterns, getPrinciples } from "@portfolio/db/queries";

import { createDecisionPatternAction } from "@/app/actions";
import { ContentList } from "@/components/content-list";
import { DecisionPatternForm } from "@/components/forms/decision-pattern-form";
import { ModalPanel } from "@/components/modal-panel";
import { PageTitle } from "@/components/page-title";

export const dynamic = "force-dynamic";

export default async function DecisionPatternsPage() {
  const [decisionPatterns, principles] = await Promise.all([
    getDecisionPatterns(),
    getPrinciples(),
  ]);

  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title="Decision Patterns"
        description="Capture recurring ways of framing trade-offs and moving from ambiguity to execution."
        actions={
          <ModalPanel
            triggerLabel="Create pattern"
            title="Create decision pattern"
            description="Add a new decision pattern and confirm before saving it."
            size="lg"
          >
            <DecisionPatternForm
              action={createDecisionPatternAction}
              title="Create decision pattern"
              submitLabel="Create Pattern"
              principleOptions={principles.map((principle) => ({
                id: principle.id,
                label: principle.title,
              }))}
            />
          </ModalPanel>
        }
      />
      <ContentList
        title="Existing decision patterns"
        emptyTitle="No decision patterns yet"
        emptyDescription="Decision patterns will appear here after they are created."
        items={decisionPatterns.map((pattern) => ({
          id: pattern.id,
          title: pattern.title,
          description: pattern.summary,
          meta: pattern.slug,
          status: pattern.status,
          editHref: `/content/decision-patterns/${pattern.id}`,
          ai: {
            contentQualityScore: pattern.contentQualityScore,
            lastAiReviewAt: pattern.lastAiReviewAt,
            aiSummary: pattern.aiSummary,
          },
        }))}
      />
    </main>
  );
}
