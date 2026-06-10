import { getAdminContentIndex } from "@portfolio/db/queries";

import { createProjectAction } from "@/app/actions";
import { ProjectForm } from "@/components/forms/project-form";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const content = await getAdminContentIndex();

  return (
    <main className="min-w-0">
      <ProjectForm
        action={createProjectAction}
        title="New project"
        submitLabel="Create project"
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
    </main>
  );
}
