import { Pencil } from "lucide-react";
import { notFound } from "next/navigation";

import { getAdminContentIndex, getProjectById } from "@portfolio/db/queries";

import { deleteProjectAction, patchProjectAction } from "@/app/actions";
import { DeleteForm } from "@/components/delete-form";
import { DetailHeader } from "@/components/detail/detail-header";
import { MetaSidebar } from "@/components/detail/meta-sidebar";
import { RichTextView } from "@/components/detail/rich-text-view";
import { SectionCard } from "@/components/detail/section-card";
import { SectionEditForm } from "@/components/detail/section-edit-form";
import { SettingsModal } from "@/components/detail/settings-modal";
import { CheckboxGroup, Field, SelectField, SeoFields } from "@/components/form-controls";
import { RichTextField } from "@/components/forms/rich-text-field";
import { ModalPanel } from "@/components/modal-panel";
import { publicHrefs } from "@/lib/public-site";

export const dynamic = "force-dynamic";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: EditPageProps) {
  const { id } = await params;
  const [project, content] = await Promise.all([getProjectById(id), getAdminContentIndex()]);

  if (!project) {
    notFound();
  }

  const lensName = new Map(content.lenses.map((lens) => [lens.id, lens.name]));
  const principleName = new Map(content.principles.map((p) => [p.id, p.title]));
  const skillName = new Map(content.skills.map((s) => [s.id, s.name]));
  const tagName = new Map(content.tags.map((t) => [t.id, t.name]));
  const experience = content.experiences.find((item) => item.id === project.experienceId);

  const positionOptions = [
    { label: "— No related position —", value: "" },
    ...content.experiences.map((item) => ({
      label: `${item.role} at ${item.company}`,
      value: item.id,
    })),
  ];
  const lensOptions = content.lenses.map((lens) => ({ id: lens.id, label: lens.name }));
  const principleOptions = content.principles.map((p) => ({ id: p.id, label: p.title }));
  const skillOptions = content.skills.map((s) => ({ id: s.id, label: s.name, category: s.category }));
  const tagOptions = content.tags.map((t) => ({ id: t.id, label: t.name, category: t.category }));

  const stackBoxes = [
    { title: "Development Tech Stack", value: project.developmentTechStack },
    { title: "Q&A Tech Stack", value: project.qaTechStack },
    { title: "AI Integration Tech Stack", value: project.aiIntegrationTechStack },
    { title: "Deployment Tech Stack", value: project.deploymentTechStack },
  ].filter((box) => box.value.trim().length > 0);
  const architectureEmpty =
    project.architecture.trim().length === 0 && stackBoxes.length === 0;

  const metaGroups = [
    {
      title: "Position",
      items: experience
        ? [{ id: experience.id, label: `${experience.role} at ${experience.company}` }]
        : [],
    },
    {
      title: "Lenses",
      items: project.lensIds.flatMap((lid) =>
        lensName.has(lid) ? [{ id: lid, label: lensName.get(lid)! }] : [],
      ),
    },
    {
      title: "Skills",
      items: project.skillIds.flatMap((sid) =>
        skillName.has(sid) ? [{ id: sid, label: skillName.get(sid)! }] : [],
      ),
    },
    {
      title: "Operating principles",
      items: project.principleIds.flatMap((pid) =>
        principleName.has(pid) ? [{ id: pid, label: principleName.get(pid)! }] : [],
      ),
    },
    {
      title: "Focus areas",
      items: project.tagIds.flatMap((tid) =>
        tagName.has(tid) ? [{ id: tid, label: tagName.get(tid)! }] : [],
      ),
    },
  ];

  const settings = (
    <SettingsModal
      id={project.id}
      action={patchProjectAction}
      fields={[
        "slug",
        "position",
        "experienceId",
        "lensIds",
        "principleIds",
        "skillIds",
        "tagIds",
        "seoTitle",
        "seoDescription",
        "ogImage",
      ]}
    >
      <Field label="Slug" name="slug" required defaultValue={project.slug} />
      <Field
        label="Order (lower shows first)"
        name="position"
        type="number"
        defaultValue={String(project.position)}
      />
      <SelectField
        label="Related position"
        name="experienceId"
        options={positionOptions}
        defaultValue={project.experienceId ?? ""}
      />
      <CheckboxGroup
        label="Related lenses"
        name="lensIds"
        emptyLabel="No lenses available."
        options={lensOptions}
        selectedIds={project.lensIds}
      />
      <CheckboxGroup
        label="Related principles"
        name="principleIds"
        emptyLabel="No principles available."
        options={principleOptions}
        selectedIds={project.principleIds}
      />
      <CheckboxGroup
        label="Skills"
        name="skillIds"
        emptyLabel="No skills available."
        options={skillOptions}
        selectedIds={project.skillIds}
      />
      <CheckboxGroup
        label="Tags"
        name="tagIds"
        emptyLabel="No tags available."
        options={tagOptions}
        selectedIds={project.tagIds}
      />
      <SeoFields defaults={project} />
    </SettingsModal>
  );

  const headerEdit = (
    <ModalPanel
      title="Edit project header"
      description="Name and links shown at the top of the project page."
      triggerLabel="Edit header"
      size="md"
      triggerClassName="ui-btn-ghost"
      triggerContent={
        <>
          <Pencil className="size-3.5" /> Edit
        </>
      }
    >
      <SectionEditForm
        action={patchProjectAction}
        id={project.id}
        fields={["name", "url", "githubUrl"]}
      >
        <Field label="Name" name="name" required defaultValue={project.name} />
        <Field label="URL" name="url" type="url" defaultValue={project.url ?? undefined} />
        <Field
          label="GitHub URL"
          name="githubUrl"
          type="url"
          defaultValue={project.githubUrl ?? undefined}
        />
      </SectionEditForm>
    </ModalPanel>
  );

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <DetailHeader
        backHref="/content/projects"
        backLabel="All projects"
        eyebrow="Project"
        title={project.name}
        id={project.id}
        status={project.status}
        statusAction={patchProjectAction}
        publicHref={project.status === "published" ? publicHrefs.project(project.slug) : null}
        settings={settings}
        headerEdit={headerEdit}
        subtitle={
          experience ? (
            <span>
              Built during{" "}
              <span className="text-amber-200">
                {experience.role} at {experience.company}
              </span>
            </span>
          ) : null
        }
      >
        {project.url || project.githubUrl ? (
          <div className="flex flex-wrap gap-3">
            {project.url ? (
              <a href={project.url} target="_blank" rel="noreferrer" className="ui-btn-primary">
                Visit project ↗
              </a>
            ) : null}
            {project.githubUrl ? (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="ui-btn-secondary"
              >
                View source ↗
              </a>
            ) : null}
          </div>
        ) : null}
      </DetailHeader>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid min-w-0 gap-6">
          <SectionCard
            title="Overview"
            id={project.id}
            action={patchProjectAction}
            fields="description"
            value={project.description}
            addLabel="Add an overview"
            formFields={
              <RichTextField
                label="Overview"
                name="description"
                rows={6}
                defaultValue={project.description}
                hint="Short summary shown on project cards and at the top of the project page."
              />
            }
          />
          <SectionCard
            title="Details"
            id={project.id}
            action={patchProjectAction}
            fields="details"
            value={project.details}
            addLabel="Add details"
            formFields={
              <RichTextField
                label="Details"
                name="details"
                rows={14}
                defaultValue={project.details}
                hint="Long-form, in-depth content shown on the project detail page."
              />
            }
          />
          <SectionCard
            title="Architecture"
            id={project.id}
            action={patchProjectAction}
            fields={[
              "architecture",
              "developmentTechStack",
              "qaTechStack",
              "aiIntegrationTechStack",
              "deploymentTechStack",
            ]}
            isEmpty={architectureEmpty}
            addLabel="Add architecture"
            preview={
              <div className="grid gap-4">
                {project.architecture.trim().length > 0 ? (
                  <div className="rounded-lg border border-line bg-white/[0.02] p-5">
                    <RichTextView value={project.architecture} />
                  </div>
                ) : null}
                {stackBoxes.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {stackBoxes.map((box) => (
                      <div
                        key={box.title}
                        className="rounded-lg border border-line bg-white/[0.02] p-5"
                      >
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-200">
                          {box.title}
                        </h3>
                        <div className="mt-3">
                          <RichTextView value={box.value} dense />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            }
            formFields={
              <>
                <RichTextField
                  label="Architecture overview"
                  name="architecture"
                  rows={8}
                  defaultValue={project.architecture}
                  hint="Optional architecture narrative shown before the stack boxes."
                />
                <div className="grid gap-4 lg:grid-cols-2">
                  <RichTextField
                    label="Development Tech Stack"
                    name="developmentTechStack"
                    rows={6}
                    defaultValue={project.developmentTechStack}
                  />
                  <RichTextField
                    label="Q&A Tech Stack"
                    name="qaTechStack"
                    rows={6}
                    defaultValue={project.qaTechStack}
                  />
                  <RichTextField
                    label="AI Integration Tech Stack"
                    name="aiIntegrationTechStack"
                    rows={6}
                    defaultValue={project.aiIntegrationTechStack}
                  />
                  <RichTextField
                    label="Deployment Tech Stack"
                    name="deploymentTechStack"
                    rows={6}
                    defaultValue={project.deploymentTechStack}
                  />
                </div>
              </>
            }
          />
        </div>

        <MetaSidebar groups={metaGroups} />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/[0.04] p-5">
        <p className="text-sm text-muted">Permanently remove this project and its relationships.</p>
        <DeleteForm action={deleteProjectAction} id={project.id} label="Delete project" />
      </div>
    </main>
  );
}
