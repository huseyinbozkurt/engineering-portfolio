import { Pencil } from "lucide-react";
import { notFound } from "next/navigation";

import { getDecisionPatternById, getPrinciples } from "@portfolio/db/queries";

import { deleteDecisionPatternAction, patchDecisionPatternAction } from "@/app/actions";
import { DeleteForm } from "@/components/delete-form";
import { DetailHeader } from "@/components/detail/detail-header";
import { MetaSidebar } from "@/components/detail/meta-sidebar";
import { SectionCard } from "@/components/detail/section-card";
import { SectionEditForm } from "@/components/detail/section-edit-form";
import { SettingsModal } from "@/components/detail/settings-modal";
import { CheckboxGroup, Field, SeoFields } from "@/components/form-controls";
import { RichTextField } from "@/components/forms/rich-text-field";
import { ModalPanel } from "@/components/modal-panel";

export const dynamic = "force-dynamic";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDecisionPatternPage({ params }: EditPageProps) {
  const { id } = await params;
  const [pattern, principles] = await Promise.all([
    getDecisionPatternById(id),
    getPrinciples(),
  ]);

  if (!pattern) {
    notFound();
  }

  const principleName = new Map(principles.map((p) => [p.id, p.title]));
  const principleOptions = principles.map((p) => ({ id: p.id, label: p.title }));

  const metaGroups = [
    {
      title: "Related principles",
      items: pattern.principleIds.flatMap((pid) =>
        principleName.has(pid) ? [{ id: pid, label: principleName.get(pid)! }] : [],
      ),
    },
  ];

  const settings = (
    <SettingsModal
      id={pattern.id}
      action={patchDecisionPatternAction}
      fields={["slug", "position", "principleIds", "seoTitle", "seoDescription", "ogImage"]}
    >
      <Field label="Slug" name="slug" required defaultValue={pattern.slug} />
      <Field
        label="Order (lower shows first)"
        name="position"
        type="number"
        defaultValue={String(pattern.position)}
      />
      <CheckboxGroup
        label="Related principles"
        name="principleIds"
        emptyLabel="No principles available."
        options={principleOptions}
        selectedIds={pattern.principleIds}
      />
      <SeoFields defaults={pattern} />
    </SettingsModal>
  );

  const headerEdit = (
    <ModalPanel
      title="Edit title"
      triggerLabel="Edit title"
      size="md"
      triggerClassName="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-xs font-medium text-muted transition hover:border-teal-300/50 hover:text-ink"
      triggerContent={
        <>
          <Pencil className="size-3.5" /> Edit
        </>
      }
    >
      <SectionEditForm action={patchDecisionPatternAction} id={pattern.id} fields="title">
        <Field label="Title" name="title" required defaultValue={pattern.title} />
      </SectionEditForm>
    </ModalPanel>
  );

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <DetailHeader
        backHref="/content/decision-patterns"
        backLabel="All decision patterns"
        eyebrow="Decision pattern"
        title={pattern.title}
        id={pattern.id}
        status={pattern.status}
        statusAction={patchDecisionPatternAction}
        settings={settings}
        headerEdit={headerEdit}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid min-w-0 gap-6">
          <SectionCard
            title="Summary"
            id={pattern.id}
            action={patchDecisionPatternAction}
            fields="summary"
            value={pattern.summary}
            addLabel="Add a summary"
            formFields={
              <RichTextField
                label="Summary"
                name="summary"
                rows={5}
                defaultValue={pattern.summary}
                hint="One-line essence of the pattern."
              />
            }
          />
          <SectionCard
            title="Body"
            id={pattern.id}
            action={patchDecisionPatternAction}
            fields="body"
            value={pattern.body}
            addLabel="Add the body"
            formFields={
              <RichTextField
                label="Body"
                name="body"
                rows={12}
                defaultValue={pattern.body}
                hint="When to reach for this pattern, and the trade-offs it manages."
              />
            }
          />
        </div>

        <MetaSidebar groups={metaGroups} emptyHint="No related principles yet — add them in Settings." />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-400/20 bg-rose-500/[0.04] p-4">
        <p className="text-sm text-muted">Permanently remove this decision pattern.</p>
        <DeleteForm action={deleteDecisionPatternAction} id={pattern.id} label="Delete pattern" />
      </div>
    </main>
  );
}
