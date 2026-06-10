import { Plus } from "lucide-react";
import Link from "next/link";

import { getAdminContentIndex } from "@portfolio/db/queries";

import { ContentList } from "@/components/content-list";
import { PageTitle } from "@/components/page-title";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CaseStudiesPage() {
  const content = await getAdminContentIndex();

  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title="Case Studies"
        description="Case studies are the primary content type and connect work to lenses, principles, experience, projects, skills, and tags."
        actions={
          <Link href="/content/case-studies/new" className="ui-btn-primary">
            <Plus className="size-4" aria-hidden /> Create case study
          </Link>
        }
      />
      <ContentList
        primaryLabel="Title"
        title="Existing case studies"
        emptyTitle="No case studies yet"
        emptyDescription="Case studies will appear here after real content is created."
        items={content.caseStudies.map((caseStudy) => ({
          id: caseStudy.id,
          title: caseStudy.title,
          description: caseStudy.excerpt,
          status: caseStudy.status,
          editHref: `/content/case-studies/${caseStudy.id}`,
          attributes: [
            { label: "Slug", value: caseStudy.slug },
            { label: "Updated", value: formatDate(caseStudy.updatedAt) },
          ],
          ai: {
            contentQualityScore: caseStudy.contentQualityScore,
            lastAiReviewAt: caseStudy.lastAiReviewAt,
            aiSummary: caseStudy.aiSummary,
          },
        }))}
      />
    </main>
  );
}
