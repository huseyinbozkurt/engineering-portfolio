import type { SkillRecord } from "@portfolio/db/queries";

import { ConfirmedForm } from "@/components/confirmed-form";
import { Field, StatusSelect, SubmitButton, TextArea } from "@/components/form-controls";

import type { FormAction } from "./types";

interface SkillFormProps {
  action: FormAction;
  title: string;
  submitLabel: string;
  defaults?: SkillRecord | undefined;
}

export function SkillForm({ action, title, submitLabel, defaults }: SkillFormProps) {
  const isEditing = Boolean(defaults);

  return (
    <ConfirmedForm
      action={action}
      className="grid gap-5"
      confirmation={{
        title: isEditing ? "Save skill changes?" : "Create this skill?",
        description: isEditing
          ? "This will update the skill and its visibility."
          : "This will add a new skill to the admin content library.",
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
          placeholder="typescript"
          defaultValue={defaults?.slug}
        />
        <StatusSelect defaultValue={defaults?.status} />
        <Field
          label="Category"
          name="category"
          placeholder="Languages"
          defaultValue={defaults?.category ?? undefined}
        />
        <Field
          label="Position"
          name="position"
          type="number"
          defaultValue={defaults ? String(defaults.position) : undefined}
        />
        <TextArea label="Summary" name="summary" rows={4} defaultValue={defaults?.summary} />
        <SubmitButton label={submitLabel} />
      </div>
    </ConfirmedForm>
  );
}
