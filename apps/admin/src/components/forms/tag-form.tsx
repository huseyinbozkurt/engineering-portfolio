import type { TagRecord } from "@portfolio/db/queries";

import { ConfirmedForm } from "@/components/confirmed-form";
import { Field, StatusSelect, SubmitButton } from "@/components/form-controls";

import type { FormAction } from "./types";

interface TagFormProps {
  action: FormAction;
  title: string;
  submitLabel: string;
  defaults?: TagRecord | undefined;
}

export function TagForm({ action, title, submitLabel, defaults }: TagFormProps) {
  const isEditing = Boolean(defaults);

  return (
    <ConfirmedForm
      action={action}
      className="grid gap-5"
      confirmation={{
        title: isEditing ? "Save tag changes?" : "Create this tag?",
        description: isEditing
          ? "This will update the tag and its visibility."
          : "This will add a new tag to the admin content library.",
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
          placeholder="platform"
          defaultValue={defaults?.slug}
        />
        <Field
          label="Category"
          name="category"
          placeholder="Domain"
          defaultValue={defaults?.category ?? undefined}
        />
        <StatusSelect defaultValue={defaults?.status} />
        <SubmitButton label={submitLabel} />
      </div>
    </ConfirmedForm>
  );
}
