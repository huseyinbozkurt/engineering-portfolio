import { Plus } from "lucide-react";
import Link from "next/link";

import { getPrinciples } from "@portfolio/db/queries";

import { ContentList } from "@/components/content-list";
import { PageTitle } from "@/components/page-title";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PrinciplesPage() {
  const principles = await getPrinciples();

  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title="Principles"
        description="Operating principles explain how decisions are made and how work is approached."
        actions={
          <Link href="/content/principles/new" className="ui-btn-primary">
            <Plus className="size-4" aria-hidden /> Create principle
          </Link>
        }
      />
      <ContentList
        primaryLabel="Title"
        title="Existing principles"
        emptyTitle="No principles yet"
        emptyDescription="Principles will appear here after real content is created."
        items={principles.map((principle) => ({
          id: principle.id,
          title: principle.title,
          description: principle.summary,
          status: principle.status,
          editHref: `/content/principles/${principle.id}`,
          attributes: [
            { label: "Slug", value: principle.slug },
            { label: "Updated", value: formatDate(principle.updatedAt) },
          ],
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
