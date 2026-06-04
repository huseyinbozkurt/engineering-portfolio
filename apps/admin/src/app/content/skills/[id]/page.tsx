import Link from "next/link";
import { notFound } from "next/navigation";

import { getSkillById } from "@portfolio/db/queries";

import { deleteSkillAction, updateSkillAction } from "@/app/actions";
import { DeleteForm } from "@/components/delete-form";
import { SkillForm } from "@/components/forms/skill-form";
import { ModalPanel } from "@/components/modal-panel";
import { PageTitle } from "@/components/page-title";
import { RecordOverview } from "@/components/record-overview";

export const dynamic = "force-dynamic";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSkillPage({ params }: EditPageProps) {
  const { id } = await params;
  const skill = await getSkillById(id);

  if (!skill) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-8 lg:px-8">
      <Link href="/content/skills" className="text-sm text-muted transition hover:text-ink">
        ← Back to skills
      </Link>
      <div className="mt-4">
        <PageTitle title="Edit skill" description="Update this skill or technology." />
      </div>
      <RecordOverview
        title={skill.name}
        description={skill.summary}
        details={[
          { label: "Status", value: skill.status },
          { label: "Slug", value: skill.slug },
          { label: "Category", value: skill.category },
          { label: "Position", value: skill.position },
        ]}
        action={
          <ModalPanel
            triggerLabel="Edit skill"
            title="Edit skill"
            description="Make changes in the form, then confirm before saving."
            size="sm"
          >
            <SkillForm
              action={updateSkillAction}
              title={skill.name}
              submitLabel="Save changes"
              defaults={skill}
            />
          </ModalPanel>
        }
      />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-white/[0.02] p-4">
        <p className="text-sm text-muted">Permanently remove this skill and its relationships.</p>
        <DeleteForm action={deleteSkillAction} id={skill.id} label="Delete skill" />
      </div>
    </main>
  );
}
