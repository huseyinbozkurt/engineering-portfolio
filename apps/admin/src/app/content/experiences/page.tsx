import { getAdminContentIndex } from "@portfolio/db/queries";

import { createExperienceAction } from "@/app/actions";
import { ContentList } from "@/components/content-list";
import { ExperienceForm } from "@/components/forms/experience-form";
import { ModalPanel } from "@/components/modal-panel";
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
          <ModalPanel
            triggerLabel="Create experience"
            title="Create experience"
            description="Add a new experience record and confirm before saving it."
            size="lg"
          >
            <ExperienceForm
              action={createExperienceAction}
              title="Create experience"
              submitLabel="Create Experience"
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
        title="Existing experience"
        emptyTitle="No experience yet"
        emptyDescription="Experience records will appear here after real roles are created."
        items={content.experiences.map((experience) => ({
          id: experience.id,
          title: `${experience.role} at ${experience.company}`,
          description: experience.summary,
          meta: experience.isCurrent ? "Current" : undefined,
          status: experience.status,
          editHref: `/content/experiences/${experience.id}`,
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
