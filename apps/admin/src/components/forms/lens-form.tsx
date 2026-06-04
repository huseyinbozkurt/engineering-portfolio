import type { LensRecord } from "@portfolio/db/queries";

import { ConfirmedForm } from "@/components/confirmed-form";
import { Field, SeoFields, StatusSelect, SubmitButton, TextArea } from "@/components/form-controls";

import type { FormAction } from "./types";

interface LensFormProps {
  action: FormAction;
  title: string;
  submitLabel: string;
  defaults?: LensRecord | undefined;
}

export function LensForm({ action, title, submitLabel, defaults }: LensFormProps) {
  const isEditing = Boolean(defaults);

  return (
    <ConfirmedForm
      action={action}
      className="grid gap-5"
      confirmation={{
        title: isEditing ? "Save lens changes?" : "Create this lens?",
        description: isEditing
          ? "This will update the lens and its visibility."
          : "This will add a new lens to the admin content library.",
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
          placeholder="build-product"
          defaultValue={defaults?.slug}
        />
        <StatusSelect defaultValue={defaults?.status} />
        <Field
          label="Accent color"
          name="accentColor"
          placeholder="#7dd3fc"
          defaultValue={defaults?.accentColor}
        />
        <Field
          label="Position"
          name="position"
          type="number"
          defaultValue={defaults ? String(defaults.position) : undefined}
        />
        <TextArea label="Summary" name="summary" rows={4} defaultValue={defaults?.summary} />
        <SeoFields defaults={defaults} />
        <SubmitButton label={submitLabel} />
      </div>
    </ConfirmedForm>
  );
}
