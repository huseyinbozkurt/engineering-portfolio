import { getAdminContentIndex } from "@portfolio/db/queries";

import { createCaseStudyAction } from "@/app/actions";
import { CaseStudyForm } from "@/components/forms/case-study-form";

export const dynamic = "force-dynamic";

export default async function NewCaseStudyPage() {
  const content = await getAdminContentIndex();

  return (
    <main className="min-w-0">
      <CaseStudyForm
        action={createCaseStudyAction}
        title="New case study"
        submitLabel="Create case study"
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
    </main>
  );
}
