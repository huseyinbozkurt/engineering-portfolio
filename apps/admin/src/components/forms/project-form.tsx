import type { ProjectEditRecord } from "@portfolio/db/queries";

import { ConfirmedForm } from "@/components/confirmed-form";
import {
  CheckboxGroup,
  Field,
  SeoFields,
  SelectField,
  StatusSelect,
  SubmitButton,
} from "@/components/form-controls";

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
  const isEditing = Boolean(defaults);
  // A project belongs to at most one position; "" maps back to null server-side.
  const positionOptions = [
    { label: "— No related position —", value: "" },
    ...experienceOptions.map((option) => ({ label: option.label, value: option.id })),
  ];

  return (
    <ConfirmedForm
      action={action}
      className="grid gap-5"
      confirmation={{
        title: isEditing ? "Save project changes?" : "Create this project?",
        description: isEditing
          ? "This will update the project and its selected relationships."
          : "This will add a new project to the admin content library.",
        confirmLabel: submitLabel,
      }}
    >
      <div className="grid gap-4">
        {defaults ? <input type="hidden" name="id" value={defaults.id} /> : null}
        <Field label="Name" name="name" required defaultValue={defaults?.name} />
        <Field
          label="Slug"
          name="slug"
          required
          placeholder="platform-redesign"
          defaultValue={defaults?.slug}
        />
        <StatusSelect defaultValue={defaults?.status} />
        <Field label="URL" name="url" type="url" defaultValue={defaults?.url ?? undefined} />
        <Field
          label="GitHub URL"
          name="githubUrl"
          type="url"
          defaultValue={defaults?.githubUrl ?? undefined}
        />
        <Field
          label="Position"
          name="position"
          type="number"
          defaultValue={defaults ? String(defaults.position) : undefined}
        />
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
        <fieldset className="grid gap-4 rounded-lg border border-line bg-white/[0.025] p-4">
          <legend className="px-1 text-sm font-medium text-ink">Architecture</legend>
          <RichTextField
            label="Architecture overview"
            name="architecture"
            rows={8}
            defaultValue={defaults?.architecture}
            hint="Optional architecture narrative shown before the stack boxes."
          />
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <RichTextField
              label="Development Tech Stack"
              name="developmentTechStack"
              rows={8}
              defaultValue={defaults?.developmentTechStack}
              hint="Optional tools, frameworks, services, and implementation choices."
            />
            <RichTextField
              label="Q&A Tech Stack"
              name="qaTechStack"
              rows={8}
              defaultValue={defaults?.qaTechStack}
              hint="Optional testing, validation, review, or quality tooling."
            />
            <RichTextField
              label="AI Integration Tech Stack"
              name="aiIntegrationTechStack"
              rows={8}
              defaultValue={defaults?.aiIntegrationTechStack}
              hint="Optional AI services, model orchestration, prompts, and retrieval tooling."
            />
            <RichTextField
              label="Deployment Tech Stack"
              name="deploymentTechStack"
              rows={8}
              defaultValue={defaults?.deploymentTechStack}
              hint="Optional hosting, CI/CD, runtime, observability, and infrastructure tooling."
            />
          </div>
        </fieldset>
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
        <SeoFields defaults={defaults} />
        <SubmitButton label={submitLabel} />
      </div>
    </ConfirmedForm>
  );
}
