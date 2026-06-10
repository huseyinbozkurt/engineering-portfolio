import { Plus } from "lucide-react";
import Link from "next/link";

import { getAdminContentIndex } from "@portfolio/db/queries";

import { ContentList } from "@/components/content-list";
import { PageTitle } from "@/components/page-title";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const content = await getAdminContentIndex();

  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title="Projects"
        description="Projects can be prepared as drafts, published publicly, and related to a position, lenses, principles, skills, and tags."
        actions={
          <Link href="/content/projects/new" className="ui-btn-primary">
            <Plus className="size-4" aria-hidden /> Create project
          </Link>
        }
      />
      <ContentList
        title="Existing projects"
        emptyTitle="No projects yet"
        emptyDescription="Projects will appear here after real project records are created."
        items={content.projects.map((project) => ({
          id: project.id,
          title: project.name,
          description: project.description,
          status: project.status,
          editHref: `/content/projects/${project.id}`,
          attributes: [
            { label: "Slug", value: project.slug },
            { label: "Updated", value: formatDate(project.updatedAt) },
          ],
          ai: {
            contentQualityScore: project.contentQualityScore,
            lastAiReviewAt: project.lastAiReviewAt,
            aiSummary: project.aiSummary,
          },
        }))}
      />
    </main>
  );
}
