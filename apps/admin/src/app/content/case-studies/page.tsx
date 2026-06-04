import { getAdminContentIndex } from "@portfolio/db/queries";

import { createCaseStudyAction } from "@/app/actions";
import { ContentList } from "@/components/content-list";
import { CaseStudyForm } from "@/components/forms/case-study-form";
import { ModalPanel } from "@/components/modal-panel";
import { PageTitle } from "@/components/page-title";

export const dynamic = "force-dynamic";

export default async function CaseStudiesPage() {
  const content = await getAdminContentIndex();

  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title="Case Studies"
        description="Case studies are the primary content type and connect work to lenses, principles, experience, projects, skills, and tags."
        actions={
          <ModalPanel
            triggerLabel="Create case study"
            title="Create case study"
            description="Add a new case study and confirm before saving it."
            size="xl"
          >
            <CaseStudyForm
              action={createCaseStudyAction}
              title="Create case study"
              submitLabel="Create Case Study"
              lensOptions={content.lenses.map((lens) => ({ id: lens.id, label: lens.name }))}
              principleOptions={content.principles.map((principle) => ({
                id: principle.id,
                label: principle.title,
              }))}
              experienceOptions={content.experiences.map((experience) => ({
                id: experience.id,
                label: `${experience.role} at ${experience.company}`,
              }))}
              projectOptions={content.projects.map((project) => ({
                id: project.id,
                label: project.name,
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
        title="Existing case studies"
        emptyTitle="No case studies yet"
        emptyDescription="Case studies will appear here after real content is created."
        items={content.caseStudies.map((caseStudy) => ({
          id: caseStudy.id,
          title: caseStudy.title,
          description: caseStudy.excerpt,
          status: caseStudy.status,
          editHref: `/content/case-studies/${caseStudy.id}`,
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
