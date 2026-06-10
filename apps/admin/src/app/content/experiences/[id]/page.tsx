import { Pencil } from "lucide-react";
import { notFound } from "next/navigation";

import { getAdminContentIndex, getExperienceById } from "@portfolio/db/queries";

import { deleteExperienceAction, patchExperienceAction } from "@/app/actions";
import { DeleteForm } from "@/components/delete-form";
import { DetailHeader } from "@/components/detail/detail-header";
import { MetaSidebar } from "@/components/detail/meta-sidebar";
import { SectionCard } from "@/components/detail/section-card";
import { SectionEditForm } from "@/components/detail/section-edit-form";
import { SettingsModal } from "@/components/detail/settings-modal";
import { Checkbox, CheckboxGroup, Field, SeoFields, TextArea } from "@/components/form-controls";
import { RichTextField } from "@/components/forms/rich-text-field";
import { ModalPanel } from "@/components/modal-panel";
import { siblingLinks } from "@/lib/detail-nav";
import { publicHrefs } from "@/lib/public-site";

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

  const siblings = siblingLinks(content.experiences, experience.id, (item) => ({
    href: `/content/experiences/${item.id}`,
    label: `${item.role} at ${item.company}`,
  }));

  const lensName = new Map(content.lenses.map((lens) => [lens.id, lens.name]));
  const principleName = new Map(content.principles.map((p) => [p.id, p.title]));
  const skillName = new Map(content.skills.map((s) => [s.id, s.name]));
  const tagName = new Map(content.tags.map((t) => [t.id, t.name]));

  const lensOptions = content.lenses.map((lens) => ({ id: lens.id, label: lens.name }));
  const principleOptions = content.principles.map((p) => ({ id: p.id, label: p.title }));
  const skillOptions = content.skills.map((s) => ({ id: s.id, label: s.name, category: s.category }));
  const tagOptions = content.tags.map((t) => ({ id: t.id, label: t.name, category: t.category }));

  const dateRange = [
    experience.startDate,
    experience.endDate ?? (experience.isCurrent ? "Present" : null),
  ]
    .filter(Boolean)
    .join(" – ");

  const metaGroups = [
    {
      title: "Lenses",
      items: experience.lensIds.flatMap((lid) =>
        lensName.has(lid) ? [{ id: lid, label: lensName.get(lid)! }] : [],
      ),
    },
    {
      title: "Skills",
      items: experience.skillIds.flatMap((sid) =>
        skillName.has(sid) ? [{ id: sid, label: skillName.get(sid)! }] : [],
      ),
    },
    {
      title: "Operating principles",
      items: experience.principleIds.flatMap((pid) =>
        principleName.has(pid) ? [{ id: pid, label: principleName.get(pid)! }] : [],
      ),
    },
    {
      title: "Focus areas",
      items: experience.tagIds.flatMap((tid) =>
        tagName.has(tid) ? [{ id: tid, label: tagName.get(tid)! }] : [],
      ),
    },
  ];

  const settings = (
    <SettingsModal
      id={experience.id}
      action={patchExperienceAction}
      fields={[
        "slug",
        "position",
        "lensIds",
        "principleIds",
        "skillIds",
        "tagIds",
        "seoTitle",
        "seoDescription",
        "ogImage",
      ]}
    >
      <Field
        label="Slug (optional)"
        name="slug"
        placeholder="senior-engineer-acme"
        defaultValue={experience.slug ?? undefined}
      />
      <Field
        label="Order (lower shows first)"
        name="position"
        type="number"
        defaultValue={String(experience.position)}
      />
      <CheckboxGroup
        label="Related lenses"
        name="lensIds"
        emptyLabel="No lenses available."
        options={lensOptions}
        selectedIds={experience.lensIds}
      />
      <CheckboxGroup
        label="Related principles"
        name="principleIds"
        emptyLabel="No principles available."
        options={principleOptions}
        selectedIds={experience.principleIds}
      />
      <CheckboxGroup
        label="Skills"
        name="skillIds"
        emptyLabel="No skills available."
        options={skillOptions}
        selectedIds={experience.skillIds}
      />
      <CheckboxGroup
        label="Tags"
        name="tagIds"
        emptyLabel="No tags available."
        options={tagOptions}
        selectedIds={experience.tagIds}
      />
      <SeoFields defaults={experience} />
    </SettingsModal>
  );

  const headerEdit = (
    <ModalPanel
      title="Edit role details"
      description="Role, company, dates, and location shown at the top of the page."
      triggerLabel="Edit role details"
      size="md"
      triggerClassName="ui-btn-ghost"
      triggerContent={
        <>
          <Pencil className="size-3.5" /> Edit
        </>
      }
    >
      <SectionEditForm
        action={patchExperienceAction}
        id={experience.id}
        fields={["role", "company", "location", "startDate", "endDate", "isCurrent"]}
      >
        <Field label="Role" name="role" required defaultValue={experience.role} />
        <Field label="Company" name="company" required defaultValue={experience.company} />
        <Field
          label="Location"
          name="location"
          defaultValue={experience.location ?? undefined}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Start date"
            name="startDate"
            type="date"
            defaultValue={experience.startDate ?? undefined}
          />
          <Field
            label="End date"
            name="endDate"
            type="date"
            defaultValue={experience.endDate ?? undefined}
          />
        </div>
        <Checkbox label="Current role" name="isCurrent" defaultChecked={experience.isCurrent} />
      </SectionEditForm>
    </ModalPanel>
  );

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <DetailHeader
        backHref="/content/experiences"
        backLabel="All experience"
        eyebrow="Experience"
        title={experience.role}
        prev={siblings.prev}
        next={siblings.next}
        id={experience.id}
        status={experience.status}
        statusAction={patchExperienceAction}
        publicHref={
          experience.status === "published"
            ? publicHrefs.experience(experience.slug || experience.id)
            : null
        }
        settings={settings}
        headerEdit={headerEdit}
        subtitle={
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-base text-ink/90">{experience.company}</span>
            {dateRange ? <span className="text-warning-200">{dateRange}</span> : null}
            {experience.location ? <span>{experience.location}</span> : null}
          </div>
        }
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid min-w-0 gap-6">
          <SectionCard
            title="Summary"
            id={experience.id}
            action={patchExperienceAction}
            fields="summary"
            value={experience.summary}
            addLabel="Add a summary"
            formFields={
              <RichTextField
                label="Summary"
                name="summary"
                rows={6}
                defaultValue={experience.summary}
                hint="Short overview shown at the top of the experience page."
              />
            }
          />
          <SectionCard
            title="Details"
            id={experience.id}
            action={patchExperienceAction}
            fields="details"
            value={experience.details}
            addLabel="Add details"
            formFields={
              <RichTextField
                label="Details"
                name="details"
                rows={14}
                defaultValue={experience.details}
                hint="Long-form, in-depth content shown on the experience detail page."
              />
            }
          />
        </div>

        <aside className="grid h-fit content-start gap-6">
          <SectionCard
            title="Awards & Recognition"
            id={experience.id}
            action={patchExperienceAction}
            fields="awards"
            value={experience.awards}
            addLabel="Add awards or recognition"
            eyebrow="Shown at the top-right of the public experience detail page."
            modalDescription="Add up to 3 short employer feedback notes, engineering awards, or recognition items. Use one item per line."
            submitLabel="Save awards"
            formFields={
              <div className="grid gap-2">
                <TextArea
                  label="Awards & Recognition"
                  name="awards"
                  rows={5}
                  defaultValue={experience.awards}
                  placeholder="One employer feedback note, award, or recognition per line"
                />
                <p className="text-xs text-muted">
                  Keep each item brief. The public experience detail page displays the first 3.
                </p>
              </div>
            }
            preview={
              <AwardsRecognitionPreview items={getAwardsRecognitionItems(experience.awards)} />
            }
          />
          <MetaSidebar groups={metaGroups} />
        </aside>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger-400/20 bg-danger-500/[0.04] p-5">
        <p className="text-sm text-muted">Permanently remove this experience record.</p>
        <DeleteForm action={deleteExperienceAction} id={experience.id} label="Delete experience" />
      </div>
    </main>
  );
}

function AwardsRecognitionPreview({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-sm leading-6 text-muted">No awards or recognition added yet.</p>;
  }

  return (
    <ol className="grid gap-3">
      {items.map((item, index) => (
        <li key={`${index}-${item}`} className="flex gap-3">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-line bg-white/[0.04] text-xs font-semibold text-accent-200">
            {index + 1}
          </span>
          <p className="text-sm leading-6 text-muted">{item}</p>
        </li>
      ))}
    </ol>
  );
}

function getAwardsRecognitionItems(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim().replace(/^(?:[-*]|\d+[.)])\s+/, ""))
    .filter((item) => item.length > 0)
    .slice(0, 3);
}
