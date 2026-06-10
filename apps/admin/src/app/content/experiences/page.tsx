import { Plus } from "lucide-react";
import Link from "next/link";

import { getAdminContentIndex } from "@portfolio/db/queries";

import { ContentList } from "@/components/content-list";
import { PageTitle } from "@/components/page-title";

export const dynamic = "force-dynamic";

export default async function ExperiencesPage() {
  const content = await getAdminContentIndex();

  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title="Experience"
        description="Add professional experience as structured context connected to lenses, principles, skills, tags, and case studies."
        actions={
          <Link href="/content/experiences/new" className="ui-btn-primary">
            <Plus className="size-4" aria-hidden /> Create experience
          </Link>
        }
      />
      <ContentList
        title="Existing experience"
        emptyTitle="No experience yet"
        emptyDescription="Experience records will appear here after real roles are created."
        primaryLabel="Title & Company"
        items={content.experiences.map((experience) => ({
          id: experience.id,
          title: experience.company,
          description: experience.summary,
          status: experience.status,
          editHref: `/content/experiences/${experience.id}`,
          attributes: [
            { label: "Role", value: experience.role },
            {
              label: "Period",
              value: [
                experience.startDate,
                experience.endDate ?? (experience.isCurrent ? "Present" : null),
              ]
                .filter(Boolean)
                .join(" – "),
            },
          ],
          ai: {
            contentQualityScore: experience.contentQualityScore,
            lastAiReviewAt: experience.lastAiReviewAt,
            aiSummary: experience.aiSummary,
          },
        }))}
      />
    </main>
  );
}
