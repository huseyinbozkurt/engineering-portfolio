import { getLenses } from "@portfolio/db/queries";

import { createLensAction } from "@/app/actions";
import { ContentList } from "@/components/content-list";
import { LensForm } from "@/components/forms/lens-form";
import { ModalPanel } from "@/components/modal-panel";
import { PageTitle } from "@/components/page-title";

export const dynamic = "force-dynamic";

export default async function LensesPage() {
  const lenses = await getLenses();

  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title="Lenses"
        description="Create the perspectives visitors can use to explore the engineering work."
        actions={
          <ModalPanel
            triggerLabel="Create lens"
            title="Create lens"
            description="Add a new lens and confirm before saving it."
            size="md"
          >
            <LensForm action={createLensAction} title="Create lens" submitLabel="Create Lens" />
          </ModalPanel>
        }
      />
      <ContentList
        title="Existing lenses"
        emptyTitle="No lenses yet"
        emptyDescription="Lens cards will appear here after real lens records are created."
        items={lenses.map((lens) => ({
          id: lens.id,
          title: lens.name,
          description: lens.summary,
          meta: lens.slug,
          status: lens.status,
          editHref: `/content/lenses/${lens.id}`,
          ai: {
            contentQualityScore: lens.contentQualityScore,
            lastAiReviewAt: lens.lastAiReviewAt,
            aiSummary: lens.aiSummary,
          },
        }))}
      />
    </main>
  );
}
