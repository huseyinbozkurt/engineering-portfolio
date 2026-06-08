import { Pencil } from "lucide-react";
import { notFound } from "next/navigation";

import { getAdminContentIndex, getCaseStudyById } from "@portfolio/db/queries";

import { deleteCaseStudyAction, patchCaseStudyAction } from "@/app/actions";
import { DeleteForm } from "@/components/delete-form";
import { DetailHeader } from "@/components/detail/detail-header";
import { MetaSidebar } from "@/components/detail/meta-sidebar";
import { SectionCard } from "@/components/detail/section-card";
import { SectionEditForm } from "@/components/detail/section-edit-form";
import { SettingsModal } from "@/components/detail/settings-modal";
import { CheckboxGroup, Field, SeoFields } from "@/components/form-controls";
import { RichTextField } from "@/components/forms/rich-text-field";
import { ModalPanel } from "@/components/modal-panel";
import { publicHrefs } from "@/lib/public-site";

export const dynamic = "force-dynamic";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

type CaseStudyTextField =
  | "excerpt"
  | "context"
  | "problem"
  | "constraints"
  | "action"
  | "tradeoffs"
  | "outcome"
  | "learning";

const NARRATIVE_SECTIONS: Array<{
  title: string;
  field: CaseStudyTextField;
  rows: number;
  hint?: string;
}> = [
  {
    title: "Excerpt",
    field: "excerpt",
    rows: 4,
    hint: "Short summary shown on cards and at the top.",
  },
  { title: "Context", field: "context", rows: 8 },
  { title: "Problem", field: "problem", rows: 8 },
  { title: "Constraints", field: "constraints", rows: 8 },
  { title: "What I Did", field: "action", rows: 10 },
  { title: "Trade-offs", field: "tradeoffs", rows: 8 },
  { title: "Outcome", field: "outcome", rows: 8 },
  { title: "What I Learned", field: "learning", rows: 8 },
];

export default async function EditCaseStudyPage({ params }: EditPageProps) {
  const { id } = await params;
  const [caseStudy, content] = await Promise.all([getCaseStudyById(id), getAdminContentIndex()]);

  if (!caseStudy) {
    notFound();
  }

  const lensName = new Map(content.lenses.map((l) => [l.id, l.name]));
  const principleName = new Map(content.principles.map((p) => [p.id, p.title]));
  const experienceName = new Map(
    content.experiences.map((e) => [e.id, `${e.role} at ${e.company}`]),
  );
  const projectName = new Map(content.projects.map((p) => [p.id, p.name]));
  const skillName = new Map(content.skills.map((s) => [s.id, s.name]));
  const tagName = new Map(content.tags.map((t) => [t.id, t.name]));

  const lensOptions = content.lenses.map((l) => ({ id: l.id, label: l.name }));
  const principleOptions = content.principles.map((p) => ({ id: p.id, label: p.title }));
  const experienceOptions = content.experiences.map((e) => ({
    id: e.id,
    label: `${e.role} at ${e.company}`,
  }));
  const projectOptions = content.projects.map((p) => ({ id: p.id, label: p.name }));
  const skillOptions = content.skills.map((s) => ({ id: s.id, label: s.name, category: s.category }));
  const tagOptions = content.tags.map((t) => ({ id: t.id, label: t.name, category: t.category }));

  const toItems = (ids: string[], lookup: Map<string, string>) =>
    ids.flatMap((rid) => (lookup.has(rid) ? [{ id: rid, label: lookup.get(rid)! }] : []));

  const metaGroups = [
    { title: "Lenses", items: toItems(caseStudy.lensIds, lensName) },
    { title: "Operating principles", items: toItems(caseStudy.principleIds, principleName) },
    { title: "Experience", items: toItems(caseStudy.experienceIds, experienceName) },
    { title: "Projects", items: toItems(caseStudy.projectIds, projectName) },
    { title: "Skills", items: toItems(caseStudy.skillIds, skillName) },
    { title: "Focus areas", items: toItems(caseStudy.tagIds, tagName) },
  ];

  const settings = (
    <SettingsModal
      id={caseStudy.id}
      action={patchCaseStudyAction}
      size="xl"
      fields={[
        "slug",
        "position",
        "lensIds",
        "principleIds",
        "experienceIds",
        "projectIds",
        "skillIds",
        "tagIds",
        "seoTitle",
        "seoDescription",
        "ogImage",
      ]}
    >
      <Field label="Slug" name="slug" required defaultValue={caseStudy.slug} />
      <Field
        label="Order (lower shows first)"
        name="position"
        type="number"
        defaultValue={String(caseStudy.position)}
      />
      <CheckboxGroup
        label="Related lenses"
        name="lensIds"
        emptyLabel="No lenses available."
        options={lensOptions}
        selectedIds={caseStudy.lensIds}
      />
      <CheckboxGroup
        label="Related principles"
        name="principleIds"
        emptyLabel="No principles available."
        options={principleOptions}
        selectedIds={caseStudy.principleIds}
      />
      <CheckboxGroup
        label="Related experience"
        name="experienceIds"
        emptyLabel="No experience available."
        options={experienceOptions}
        selectedIds={caseStudy.experienceIds}
      />
      <CheckboxGroup
        label="Related projects"
        name="projectIds"
        emptyLabel="No projects available."
        options={projectOptions}
        selectedIds={caseStudy.projectIds}
      />
      <CheckboxGroup
        label="Skills"
        name="skillIds"
        emptyLabel="No skills available."
        options={skillOptions}
        selectedIds={caseStudy.skillIds}
      />
      <CheckboxGroup
        label="Tags"
        name="tagIds"
        emptyLabel="No tags available."
        options={tagOptions}
        selectedIds={caseStudy.tagIds}
      />
      <SeoFields defaults={caseStudy} />
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
      <SectionEditForm action={patchCaseStudyAction} id={caseStudy.id} fields="title">
        <Field label="Title" name="title" required defaultValue={caseStudy.title} />
      </SectionEditForm>
    </ModalPanel>
  );

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <DetailHeader
        backHref="/content/case-studies"
        backLabel="All case studies"
        eyebrow="Case study"
        title={caseStudy.title}
        id={caseStudy.id}
        status={caseStudy.status}
        statusAction={patchCaseStudyAction}
        publicHref={caseStudy.status === "published" ? publicHrefs.caseStudy(caseStudy.slug) : null}
        settings={settings}
        headerEdit={headerEdit}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid min-w-0 gap-6">
          {NARRATIVE_SECTIONS.map((section) => (
            <SectionCard
              key={section.field}
              title={section.title}
              id={caseStudy.id}
              action={patchCaseStudyAction}
              fields={section.field}
              value={caseStudy[section.field]}
              addLabel={`Add ${section.title.toLowerCase()}`}
              formFields={
                <RichTextField
                  label={section.title}
                  name={section.field}
                  rows={section.rows}
                  defaultValue={caseStudy[section.field]}
                  hint={section.hint}
                />
              }
            />
          ))}
        </div>

        <MetaSidebar groups={metaGroups} />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/[0.04] p-5">
        <p className="text-sm text-muted">Permanently remove this case study and its relationships.</p>
        <DeleteForm action={deleteCaseStudyAction} id={caseStudy.id} label="Delete case study" />
      </div>
    </main>
  );
}
