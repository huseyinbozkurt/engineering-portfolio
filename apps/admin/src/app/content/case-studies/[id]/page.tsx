import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdminContentIndex, getCaseStudyById } from "@portfolio/db/queries";

import { deleteCaseStudyAction, updateCaseStudyAction } from "@/app/actions";
import { DeleteForm } from "@/components/delete-form";
import { CaseStudyForm } from "@/components/forms/case-study-form";
import { ModalPanel } from "@/components/modal-panel";
import { PageTitle } from "@/components/page-title";
import { RecordOverview } from "@/components/record-overview";

export const dynamic = "force-dynamic";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCaseStudyPage({ params }: EditPageProps) {
  const { id } = await params;
  const [caseStudy, content] = await Promise.all([getCaseStudyById(id), getAdminContentIndex()]);

  if (!caseStudy) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 lg:px-8">
      <Link href="/content/case-studies" className="text-sm text-muted transition hover:text-ink">
        ← Back to case studies
      </Link>
      <div className="mt-4">
        <PageTitle
          title="Edit case study"
          description="Update this case study, its relationships, and its visibility."
        />
      </div>
      <RecordOverview
        title={caseStudy.title}
        description={caseStudy.excerpt}
        details={[
          { label: "Status", value: caseStudy.status },
          { label: "Slug", value: caseStudy.slug },
          { label: "Position", value: caseStudy.position },
        ]}
        action={
          <ModalPanel
            triggerLabel="Edit case study"
            title="Edit case study"
            description="Make changes in the form, then confirm before saving."
            size="xl"
          >
            <CaseStudyForm
              action={updateCaseStudyAction}
              title={caseStudy.title}
              submitLabel="Save changes"
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
              defaults={caseStudy}
            />
          </ModalPanel>
        }
      />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-white/[0.02] p-4">
        <p className="text-sm text-muted">Permanently remove this case study and its relationships.</p>
        <DeleteForm
          action={deleteCaseStudyAction}
          id={caseStudy.id}
          label="Delete case study"
        />
      </div>
    </main>
  );
}
