import { Pencil } from "lucide-react";
import { notFound } from "next/navigation";

import { getTagById, getTags } from "@portfolio/db/queries";

import { deleteTagAction, patchTagAction } from "@/app/actions";
import { DeleteForm } from "@/components/delete-form";
import { DetailHeader } from "@/components/detail/detail-header";
import { SectionEditForm } from "@/components/detail/section-edit-form";
import { SettingsModal } from "@/components/detail/settings-modal";
import { Field } from "@/components/form-controls";
import { ModalPanel } from "@/components/modal-panel";
import { siblingLinks } from "@/lib/detail-nav";

export const dynamic = "force-dynamic";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTagPage({ params }: EditPageProps) {
  const { id } = await params;
  const [tag, tags] = await Promise.all([getTagById(id), getTags()]);

  if (!tag) {
    notFound();
  }

  const siblings = siblingLinks(tags, tag.id, (item) => ({
    href: `/content/tags/${item.id}`,
    label: item.name,
  }));

  const settings = (
    <SettingsModal
      id={tag.id}
      action={patchTagAction}
      size="sm"
      description="Slug and category. Tags have no SEO fields."
      fields={["slug", "category"]}
    >
      <Field label="Slug" name="slug" required defaultValue={tag.slug} />
      <Field
        label="Category"
        name="category"
        placeholder="Domain"
        defaultValue={tag.category ?? undefined}
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
      <SectionEditForm action={patchTagAction} id={tag.id} fields="name">
        <Field label="Name" name="name" required defaultValue={tag.name} />
      </SectionEditForm>
    </ModalPanel>
  );

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 lg:px-8">
      <DetailHeader
        backHref="/content/tags"
        backLabel="All tags"
        eyebrow="Tag"
        title={tag.name}
        prev={siblings.prev}
        next={siblings.next}
        id={tag.id}
        status={tag.status}
        statusAction={patchTagAction}
        settings={settings}
        headerEdit={headerEdit}
        subtitle={
          tag.category ? (
            <span className="rounded-full border border-line bg-white/5 px-2.5 py-0.5 text-xs text-muted">
              {tag.category}
            </span>
          ) : null
        }
      />

      <div className="mt-8 ui-card p-5 text-sm leading-6 text-muted">
        Tags are labels applied to projects, experience, and case studies. Choose where this tag
        appears from each of those records (in their Settings), or edit its name, category, slug,
        and publish state here.
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger-400/20 bg-danger-500/[0.04] p-5">
        <p className="text-sm text-muted">Permanently remove this tag and its relationships.</p>
        <DeleteForm action={deleteTagAction} id={tag.id} label="Delete tag" />
      </div>
    </main>
  );
}
