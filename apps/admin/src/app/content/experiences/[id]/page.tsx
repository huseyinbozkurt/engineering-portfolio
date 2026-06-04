import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdminContentIndex, getExperienceById } from "@portfolio/db/queries";

import { deleteExperienceAction, updateExperienceAction } from "@/app/actions";
import { DeleteForm } from "@/components/delete-form";
import { ExperienceForm } from "@/components/forms/experience-form";
import { ModalPanel } from "@/components/modal-panel";
import { PageTitle } from "@/components/page-title";
import { RecordOverview } from "@/components/record-overview";

export const dynamic = "force-dynamic";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditExperiencePage({ params }: EditPageProps) {
  const { id } = await params;
  const [experience, content] = await Promise.all([
    getExperienceById(id),
    getAdminContentIndex(),
  ]);

  if (!experience) {
    notFound();
  }

  const dateRange = [experience.startDate, experience.endDate ?? (experience.isCurrent ? "Present" : null)]
    .filter(Boolean)
    .join(" - ");

  return (
    <main className="mx-auto max-w-2xl px-5 py-8 lg:px-8">
      <Link href="/content/experiences" className="text-sm text-muted transition hover:text-ink">
        ← Back to experience
      </Link>
      <div className="mt-4">
        <PageTitle title="Edit experience" description="Update this role and its relationships." />
      </div>
      <RecordOverview
        title={`${experience.role} at ${experience.company}`}
        description={experience.summary}
        details={[
          { label: "Status", value: experience.status },
          { label: "Slug", value: experience.slug },
          { label: "Dates", value: dateRange || undefined },
          { label: "Location", value: experience.location },
        ]}
        action={
          <ModalPanel
            triggerLabel="Edit experience"
            title="Edit experience"
            description="Make changes in the form, then confirm before saving."
            size="lg"
          >
            <ExperienceForm
              action={updateExperienceAction}
              title={`${experience.role} at ${experience.company}`}
              submitLabel="Save changes"
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
              defaults={experience}
            />
          </ModalPanel>
        }
      />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-white/[0.02] p-4">
        <p className="text-sm text-muted">Permanently remove this experience record.</p>
        <DeleteForm
          action={deleteExperienceAction}
          id={experience.id}
          label="Delete experience"
        />
      </div>
    </main>
  );
}
