import type { ExperienceEditRecord } from "@portfolio/db/queries";

import { ConfirmedForm } from "@/components/confirmed-form";
import {
  Checkbox,
  CheckboxGroup,
  Field,
  SeoFields,
  StatusSelect,
  SubmitButton,
} from "@/components/form-controls";

import { RichTextField } from "./rich-text-field";
import type { FormAction, RelationOption } from "./types";

interface ExperienceFormProps {
  action: FormAction;
  title: string;
  submitLabel: string;
  lensOptions: RelationOption[];
  principleOptions: RelationOption[];
  skillOptions: RelationOption[];
  tagOptions: RelationOption[];
  defaults?: ExperienceEditRecord | undefined;
}

export function ExperienceForm({
  action,
  title,
  submitLabel,
  lensOptions,
  principleOptions,
  skillOptions,
  tagOptions,
  defaults,
}: ExperienceFormProps) {
  const isEditing = Boolean(defaults);

  return (
    <ConfirmedForm
      action={action}
      className="grid gap-5"
      confirmation={{
        title: isEditing ? "Save experience changes?" : "Create this experience?",
        description: isEditing
          ? "This will update the experience record and its selected relationships."
          : "This will add a new experience record to the admin content library.",
        confirmLabel: submitLabel,
      }}
    >
      <div className="grid gap-4">
        {defaults ? <input type="hidden" name="id" value={defaults.id} /> : null}
        <Field label="Company" name="company" required defaultValue={defaults?.company} />
        <Field label="Role" name="role" required defaultValue={defaults?.role} />
        <Field
          label="Slug"
          name="slug"
          placeholder="huawei-team-lead"
          defaultValue={defaults?.slug ?? undefined}
        />
        <Field label="Location" name="location" defaultValue={defaults?.location ?? undefined} />
        <div className="grid gap-4 sm:grid-cols-2">
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
        <Checkbox label="Current role" name="isCurrent" defaultChecked={defaults?.isCurrent ?? false} />
        <StatusSelect defaultValue={defaults?.status} />
        <RichTextField
          label="Summary"
          name="summary"
          rows={6}
          defaultValue={defaults?.summary}
          hint="Short overview shown at the top of the experience page."
        />
        <RichTextField
          label="Details"
          name="details"
          rows={14}
          defaultValue={defaults?.details}
          hint="Long-form, in-depth content shown lower on the experience detail page."
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
