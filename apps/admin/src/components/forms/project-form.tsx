import type { ProjectEditRecord } from "@portfolio/db/queries";

import { ConfirmedForm } from "@/components/confirmed-form";
import {
  CheckboxGroup,
  Field,
  SeoFields,
  StatusSelect,
  SubmitButton,
  TextArea,
} from "@/components/form-controls";

import type { FormAction, RelationOption } from "./types";

interface ProjectFormProps {
  action: FormAction;
  title: string;
  submitLabel: string;
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
  lensOptions,
  principleOptions,
  skillOptions,
  tagOptions,
  defaults,
}: ProjectFormProps) {
  const isEditing = Boolean(defaults);

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
        <TextArea
          label="Description"
          name="description"
          rows={7}
          defaultValue={defaults?.description}
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
