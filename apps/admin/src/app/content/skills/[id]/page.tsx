import { Pencil } from "lucide-react";
import { notFound } from "next/navigation";

import { getSkillById, getSkills } from "@portfolio/db/queries";

import { deleteSkillAction, patchSkillAction } from "@/app/actions";
import { DeleteForm } from "@/components/delete-form";
import { DetailHeader } from "@/components/detail/detail-header";
import { SectionCard } from "@/components/detail/section-card";
import { SectionEditForm } from "@/components/detail/section-edit-form";
import { SettingsModal } from "@/components/detail/settings-modal";
import { Field } from "@/components/form-controls";
import { RichTextField } from "@/components/forms/rich-text-field";
import { ModalPanel } from "@/components/modal-panel";
import { siblingLinks } from "@/lib/detail-nav";

export const dynamic = "force-dynamic";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSkillPage({ params }: EditPageProps) {
  const { id } = await params;
  const [skill, skills] = await Promise.all([getSkillById(id), getSkills()]);

  if (!skill) {
    notFound();
  }

  const siblings = siblingLinks(skills, skill.id, (item) => ({
    href: `/content/skills/${item.id}`,
    label: item.name,
  }));

  const settings = (
    <SettingsModal
      id={skill.id}
      action={patchSkillAction}
      size="sm"
      description="Slug, category, and ordering. Skills have no SEO fields."
      fields={["slug", "category", "position"]}
    >
      <Field label="Slug" name="slug" required defaultValue={skill.slug} />
      <Field
        label="Category"
        name="category"
        placeholder="Languages"
        defaultValue={skill.category ?? undefined}
      />
      <Field
        label="Order (lower shows first)"
        name="position"
        type="number"
        defaultValue={String(skill.position)}
      />
    </SettingsModal>
  );

  const headerEdit = (
    <ModalPanel
      title="Edit name"
      triggerLabel="Edit name"
      size="sm"
      triggerClassName="ui-btn-ghost"
      triggerContent={
        <>
          <Pencil className="size-3.5" /> Edit
        </>
      }
    >
      <SectionEditForm action={patchSkillAction} id={skill.id} fields="name">
        <Field label="Name" name="name" required defaultValue={skill.name} />
      </SectionEditForm>
    </ModalPanel>
  );

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 lg:px-8">
      <DetailHeader
        backHref="/content/skills"
        backLabel="All skills"
        eyebrow="Skill"
        title={skill.name}
        prev={siblings.prev}
        next={siblings.next}
        id={skill.id}
        status={skill.status}
        statusAction={patchSkillAction}
        settings={settings}
        headerEdit={headerEdit}
        subtitle={
          skill.category ? (
            <span className="rounded-full border border-line bg-white/5 px-2.5 py-0.5 text-xs text-muted">
              {skill.category}
            </span>
          ) : null
        }
      />

      <div className="mt-8 grid gap-6">
        <SectionCard
          title="Summary"
          id={skill.id}
          action={patchSkillAction}
          fields="summary"
          value={skill.summary}
          modalSize="md"
          addLabel="Add a summary"
          formFields={
            <RichTextField
              label="Summary"
              name="summary"
              rows={5}
              defaultValue={skill.summary}
              hint="Optional short description of this skill or technology."
            />
          }
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger-400/20 bg-danger-500/[0.04] p-5">
        <p className="text-sm text-muted">Permanently remove this skill and its relationships.</p>
        <DeleteForm action={deleteSkillAction} id={skill.id} label="Delete skill" />
      </div>
    </main>
  );
}
