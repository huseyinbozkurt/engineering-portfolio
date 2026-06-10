import { Pencil } from "lucide-react";
import { notFound } from "next/navigation";

import { getPrincipleById, getPrinciples } from "@portfolio/db/queries";

import { deletePrincipleAction, patchPrincipleAction } from "@/app/actions";
import { DeleteForm } from "@/components/delete-form";
import { DetailHeader } from "@/components/detail/detail-header";
import { SectionCard } from "@/components/detail/section-card";
import { SectionEditForm } from "@/components/detail/section-edit-form";
import { SettingsModal } from "@/components/detail/settings-modal";
import { Field, SeoFields } from "@/components/form-controls";
import { RichTextField } from "@/components/forms/rich-text-field";
import { ModalPanel } from "@/components/modal-panel";
import { siblingLinks } from "@/lib/detail-nav";

export const dynamic = "force-dynamic";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPrinciplePage({ params }: EditPageProps) {
  const { id } = await params;
  const [principle, principles] = await Promise.all([getPrincipleById(id), getPrinciples()]);

  if (!principle) {
    notFound();
  }

  const siblings = siblingLinks(principles, principle.id, (item) => ({
    href: `/content/principles/${item.id}`,
    label: item.title,
  }));

  const settings = (
    <SettingsModal
      id={principle.id}
      action={patchPrincipleAction}
      size="md"
      fields={["slug", "position", "seoTitle", "seoDescription", "ogImage"]}
    >
      <Field label="Slug" name="slug" required defaultValue={principle.slug} />
      <Field
        label="Order (lower shows first)"
        name="position"
        type="number"
        defaultValue={String(principle.position)}
      />
      <SeoFields defaults={principle} />
    </SettingsModal>
  );

  const headerEdit = (
    <ModalPanel
      title="Edit title"
      triggerLabel="Edit title"
      size="md"
      triggerClassName="ui-btn-ghost"
      triggerContent={
        <>
          <Pencil className="size-3.5" /> Edit
        </>
      }
    >
      <SectionEditForm action={patchPrincipleAction} id={principle.id} fields="title">
        <Field label="Title" name="title" required defaultValue={principle.title} />
      </SectionEditForm>
    </ModalPanel>
  );

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 lg:px-8">
      <DetailHeader
        backHref="/content/principles"
        backLabel="All principles"
        eyebrow="Operating principle"
        title={principle.title}
        prev={siblings.prev}
        next={siblings.next}
        id={principle.id}
        status={principle.status}
        statusAction={patchPrincipleAction}
        settings={settings}
        headerEdit={headerEdit}
      />

      <div className="mt-8 grid gap-6">
        <SectionCard
          title="Summary"
          id={principle.id}
          action={patchPrincipleAction}
          fields="summary"
          value={principle.summary}
          addLabel="Add a summary"
          formFields={
            <RichTextField
              label="Summary"
              name="summary"
              rows={5}
              defaultValue={principle.summary}
              hint="One-line essence of the principle."
            />
          }
        />
        <SectionCard
          title="Body"
          id={principle.id}
          action={patchPrincipleAction}
          fields="body"
          value={principle.body}
          addLabel="Add the body"
          formFields={
            <RichTextField
              label="Body"
              name="body"
              rows={12}
              defaultValue={principle.body}
              hint="Long-form explanation of how this principle plays out in practice."
            />
          }
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger-400/20 bg-danger-500/[0.04] p-5">
        <p className="text-sm text-muted">Permanently remove this principle.</p>
        <DeleteForm action={deletePrincipleAction} id={principle.id} label="Delete principle" />
      </div>
    </main>
  );
}
