import { getAdminContentIndex } from "@portfolio/db/queries";

import { createProjectAction } from "@/app/actions";
import { ContentList } from "@/components/content-list";
import { ProjectForm } from "@/components/forms/project-form";
import { ModalPanel } from "@/components/modal-panel";
import { PageTitle } from "@/components/page-title";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const content = await getAdminContentIndex();

  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title="Projects"
        description="Projects can be prepared as drafts, published publicly, and related to a position, lenses, principles, skills, and tags."
        actions={
          <ModalPanel
            triggerLabel="Create project"
            title="Create project"
            description="Add a new project and confirm before saving it."
            size="lg"
          >
            <ProjectForm
              action={createProjectAction}
              title="Create project"
              submitLabel="Create Project"
              experienceOptions={content.experiences.map((experience) => ({
                id: experience.id,
                label: `${experience.role} at ${experience.company}`,
              }))}
              lensOptions={content.lenses.map((lens) => ({ id: lens.id, label: lens.name }))}
              principleOptions={content.principles.map((principle) => ({
                id: principle.id,
                label: principle.title,
              }))}
              skillOptions={content.skills.map((skill) => ({
                id: skill.id,
                label: skill.name,
                category: skill.category,
              }))}
              tagOptions={content.tags.map((tag) => ({
                id: tag.id,
                label: tag.name,
                category: tag.category,
              }))}
            />
          </ModalPanel>
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
