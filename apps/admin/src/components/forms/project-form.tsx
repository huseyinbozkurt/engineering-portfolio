import type { ProjectEditRecord } from "@portfolio/db/queries";

import { ConfirmedForm } from "@/components/confirmed-form";
import { CheckboxGroup, Field, SeoFields, SelectField, StatusSelect } from "@/components/form-controls";
import { SaveBar } from "@/components/save-bar";

import { FormDisclosure, FormSection } from "./form-section";
import { RichTextField } from "./rich-text-field";
import type { FormAction, RelationOption } from "./types";

interface ProjectFormProps {
  action: FormAction;
  title: string;
  submitLabel: string;
  experienceOptions: RelationOption[];
  lensOptions: RelationOption[];
  principleOptions: RelationOption[];
  skillOptions: RelationOption[];
  tagOptions: RelationOption[];
  defaults?: ProjectEditRecord | undefined;
}

/**
 * Full-page project editor: primary content up top, optional architecture,
 * relationships, and SEO/ordering folded into disclosures. Field names match
 * `createProjectAction` / `updateProjectAction` exactly.
 */
export function ProjectForm({
  action,
  title,
  submitLabel,
  experienceOptions,
  lensOptions,
  principleOptions,
  skillOptions,
  tagOptions,
  defaults,
}: ProjectFormProps) {
  // A project belongs to at most one position; "" maps back to null server-side.
  const positionOptions = [
    { label: "— No related position —", value: "" },
    ...experienceOptions.map((option) => ({ label: option.label, value: option.id })),
  ];

  return (
    <ConfirmedForm action={action} confirm="off" trackDirty className="min-w-0">
      <SaveBar title={title} saveLabel={submitLabel} isNew={!defaults} />

      <div className="px-5 pb-24 pt-6 lg:px-8">
        <div className="grid max-w-4xl gap-6">
          {defaults ? <input type="hidden" name="id" value={defaults.id} /> : null}

          <FormSection title="Basics" description="Name, slug, links, and publish state.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name" name="name" required defaultValue={defaults?.name} />
              <Field
                label="Slug"
                name="slug"
                required
                placeholder="platform-redesign"
                defaultValue={defaults?.slug}
              />
              <Field label="URL" name="url" type="url" defaultValue={defaults?.url ?? undefined} />
              <Field
                label="GitHub URL"
                name="githubUrl"
                type="url"
                defaultValue={defaults?.githubUrl ?? undefined}
              />
              <Field
                label="Start date"
                name="startDate"
                type="date"
                defaultValue={defaults?.startDate ?? undefined}
              />
              <Field
                label="End date"
                name="endDate"
                type="date"
                defaultValue={defaults?.endDate ?? undefined}
              />
            </div>
            <StatusSelect defaultValue={defaults?.status} />
          </FormSection>

          <FormSection title="Content" description="What visitors read on the project page.">
            <RichTextField
              label="Description"
              name="description"
              rows={6}
              defaultValue={defaults?.description}
              hint="Short summary shown on project cards and at the top of the project page."
            />
            <RichTextField
              label="Details"
              name="details"
              rows={14}
              defaultValue={defaults?.details}
              hint="Long-form, in-depth content shown on the project detail page."
            />
          </FormSection>

          <FormDisclosure
            title="Architecture & tech stacks"
            description="Optional architecture narrative and the four stack boxes."
          >
            <RichTextField
              label="Architecture overview"
              name="architecture"
              rows={8}
              defaultValue={defaults?.architecture}
              hint="Optional architecture narrative shown before the stack boxes."
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <RichTextField
                label="Development Tech Stack"
                name="developmentTechStack"
                rows={6}
                defaultValue={defaults?.developmentTechStack}
                hint="Tools, frameworks, services, and implementation choices."
              />
              <RichTextField
                label="Q&A Tech Stack"
                name="qaTechStack"
                rows={6}
                defaultValue={defaults?.qaTechStack}
                hint="Testing, validation, review, or quality tooling."
              />
              <RichTextField
                label="AI Integration Tech Stack"
                name="aiIntegrationTechStack"
                rows={6}
                defaultValue={defaults?.aiIntegrationTechStack}
                hint="AI services, model orchestration, prompts, retrieval tooling."
              />
              <RichTextField
                label="Deployment Tech Stack"
                name="deploymentTechStack"
                rows={6}
                defaultValue={defaults?.deploymentTechStack}
                hint="Hosting, CI/CD, runtime, observability, infrastructure."
              />
            </div>
          </FormDisclosure>

          <FormDisclosure
            title="Relationships"
            description="Link the project to a position, lenses, principles, skills, and tags."
          >
            <SelectField
              label="Related position"
              name="experienceId"
              options={positionOptions}
              defaultValue={defaults?.experienceId ?? ""}
            />
            <CheckboxGroup
              label="Related lenses"
              name="lensIds"
              emptyLabel="No lenses available."
              options={lensOptions}
              selectedIds={defaults?.lensIds}
            />
            <CheckboxGroup
              label="Related principles"
              name="principleIds"
              emptyLabel="No principles available."
              options={principleOptions}
              selectedIds={defaults?.principleIds}
            />
            <CheckboxGroup
              label="Skills"
              name="skillIds"
              emptyLabel="No skills available."
              options={skillOptions}
              selectedIds={defaults?.skillIds}
            />
            <CheckboxGroup
              label="Tags"
              name="tagIds"
              emptyLabel="No tags available."
              options={tagOptions}
              selectedIds={defaults?.tagIds}
            />
          </FormDisclosure>

          <FormDisclosure
            title="Ordering & SEO"
            description="Display order plus optional search and social overrides."
          >
            <Field
              label="Order (lower shows first)"
              name="position"
              type="number"
              defaultValue={defaults ? String(defaults.position) : undefined}
            />
            <SeoFields bare defaults={defaults} />
          </FormDisclosure>
        </div>
      </div>
    </ConfirmedForm>
  );
}
