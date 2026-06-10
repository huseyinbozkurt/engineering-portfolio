import { getAdminContentIndex } from "@portfolio/db/queries";

import { createExperienceAction } from "@/app/actions";
import { ExperienceForm } from "@/components/forms/experience-form";

export const dynamic = "force-dynamic";

export default async function NewExperiencePage() {
  const content = await getAdminContentIndex();

  return (
    <main className="min-w-0">
      <ExperienceForm
        action={createExperienceAction}
        title="New experience"
        submitLabel="Create experience"
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
