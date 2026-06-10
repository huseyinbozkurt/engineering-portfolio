import { Plus } from "lucide-react";
import Link from "next/link";

import { getDecisionPatterns } from "@portfolio/db/queries";

import { ContentList } from "@/components/content-list";
import { PageTitle } from "@/components/page-title";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DecisionPatternsPage() {
  const decisionPatterns = await getDecisionPatterns();

  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title="Decision Patterns"
        description="Capture recurring ways of framing trade-offs and moving from ambiguity to execution."
        actions={
          <Link href="/content/decision-patterns/new" className="ui-btn-primary">
            <Plus className="size-4" aria-hidden /> Create pattern
          </Link>
        }
      />
      <ContentList
        primaryLabel="Title"
        title="Existing decision patterns"
        emptyTitle="No decision patterns yet"
        emptyDescription="Decision patterns will appear here after they are created."
        items={decisionPatterns.map((pattern) => ({
          id: pattern.id,
          title: pattern.title,
          description: pattern.summary,
          status: pattern.status,
          editHref: `/content/decision-patterns/${pattern.id}`,
          attributes: [
            { label: "Slug", value: pattern.slug },
            { label: "Updated", value: formatDate(pattern.updatedAt) },
          ],
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
