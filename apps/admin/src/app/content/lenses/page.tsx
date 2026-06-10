import { Plus } from "lucide-react";
import Link from "next/link";

import { getLenses } from "@portfolio/db/queries";

import { ContentList } from "@/components/content-list";
import { PageTitle } from "@/components/page-title";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LensesPage() {
  const lenses = await getLenses();

  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title="Lenses"
        description="Create the perspectives visitors can use to explore the engineering work."
        actions={
          <Link href="/content/lenses/new" className="ui-btn-primary">
            <Plus className="size-4" aria-hidden /> Create lens
          </Link>
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
          status: lens.status,
          editHref: `/content/lenses/${lens.id}`,
          attributes: [
            { label: "Slug", value: lens.slug },
            { label: "Updated", value: formatDate(lens.updatedAt) },
          ],
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
