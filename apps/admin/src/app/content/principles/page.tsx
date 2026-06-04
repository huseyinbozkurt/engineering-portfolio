import { getPrinciples } from "@portfolio/db/queries";

import { createPrincipleAction } from "@/app/actions";
import { ContentList } from "@/components/content-list";
import { PrincipleForm } from "@/components/forms/principle-form";
import { ModalPanel } from "@/components/modal-panel";
import { PageTitle } from "@/components/page-title";

export const dynamic = "force-dynamic";

export default async function PrinciplesPage() {
  const principles = await getPrinciples();

  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title="Principles"
        description="Operating principles explain how decisions are made and how work is approached."
        actions={
          <ModalPanel
            triggerLabel="Create principle"
            title="Create principle"
            description="Add a new principle and confirm before saving it."
            size="md"
          >
            <PrincipleForm
              action={createPrincipleAction}
              title="Create principle"
              submitLabel="Create Principle"
            />
          </ModalPanel>
        }
      />
      <ContentList
        title="Existing principles"
        emptyTitle="No principles yet"
        emptyDescription="Principles will appear here after real content is created."
        items={principles.map((principle) => ({
          id: principle.id,
          title: principle.title,
          description: principle.summary,
          meta: principle.slug,
          status: principle.status,
          editHref: `/content/principles/${principle.id}`,
          ai: {
            contentQualityScore: principle.contentQualityScore,
            lastAiReviewAt: principle.lastAiReviewAt,
            aiSummary: principle.aiSummary,
          },
        }))}
      />
    </main>
  );
}
