import { Pencil } from "lucide-react";
import { notFound } from "next/navigation";

import { getLensById } from "@portfolio/db/queries";

import { deleteLensAction, patchLensAction } from "@/app/actions";
import { DeleteForm } from "@/components/delete-form";
import { DetailHeader } from "@/components/detail/detail-header";
import { SectionCard } from "@/components/detail/section-card";
import { SectionEditForm } from "@/components/detail/section-edit-form";
import { SettingsModal } from "@/components/detail/settings-modal";
import { Field, SeoFields } from "@/components/form-controls";
import { RichTextField } from "@/components/forms/rich-text-field";
import { ModalPanel } from "@/components/modal-panel";
import { publicHrefs } from "@/lib/public-site";

export const dynamic = "force-dynamic";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLensPage({ params }: EditPageProps) {
  const { id } = await params;
  const lens = await getLensById(id);

  if (!lens) {
    notFound();
  }

  const settings = (
    <SettingsModal
      id={lens.id}
      action={patchLensAction}
      size="md"
      fields={["slug", "position", "accentColor", "seoTitle", "seoDescription", "ogImage"]}
    >
      <Field label="Slug" name="slug" required defaultValue={lens.slug} />
      <Field
        label="Order (lower shows first)"
        name="position"
        type="number"
        defaultValue={String(lens.position)}
      />
      <Field
        label="Accent color"
        name="accentColor"
        placeholder="#7dd3fc"
        defaultValue={lens.accentColor}
      />
      <SeoFields defaults={lens} />
    </SettingsModal>
  );

  const headerEdit = (
    <ModalPanel
      title="Edit name"
      triggerLabel="Edit name"
      size="md"
      triggerClassName="ui-btn-ghost"
      triggerContent={
        <>
          <Pencil className="size-3.5" /> Edit
        </>
      }
    >
      <SectionEditForm action={patchLensAction} id={lens.id} fields="name">
        <Field label="Name" name="name" required defaultValue={lens.name} />
      </SectionEditForm>
    </ModalPanel>
  );

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 lg:px-8">
      <DetailHeader
        backHref="/content/lenses"
        backLabel="All lenses"
        eyebrow="Lens"
        title={lens.name}
        id={lens.id}
        status={lens.status}
        statusAction={patchLensAction}
        publicHref={lens.status === "published" ? publicHrefs.lens(lens.slug) : null}
        settings={settings}
        headerEdit={headerEdit}
        subtitle={
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden
              className="size-3 rounded-full border border-line"
              style={{ backgroundColor: lens.accentColor }}
            />
            <span className="text-muted">{lens.accentColor}</span>
          </span>
        }
      />

      <div className="mt-8 grid gap-6">
        <SectionCard
          title="Summary"
          id={lens.id}
          action={patchLensAction}
          fields="summary"
          value={lens.summary}
          addLabel="Add a summary"
          formFields={
            <RichTextField
              label="Summary"
              name="summary"
              rows={6}
              defaultValue={lens.summary}
              hint="Short description of this lens, shown on the public lens page."
            />
          }
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/[0.04] p-5">
        <p className="text-sm text-muted">Permanently remove this lens.</p>
        <DeleteForm action={deleteLensAction} id={lens.id} label="Delete lens" />
      </div>
    </main>
  );
}
