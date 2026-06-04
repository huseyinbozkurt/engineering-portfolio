import type { PrincipleRecord } from "@portfolio/db/queries";

import { ConfirmedForm } from "@/components/confirmed-form";
import { Field, SeoFields, StatusSelect, SubmitButton, TextArea } from "@/components/form-controls";

import type { FormAction } from "./types";

interface PrincipleFormProps {
  action: FormAction;
  title: string;
  submitLabel: string;
  defaults?: PrincipleRecord | undefined;
}

export function PrincipleForm({ action, title, submitLabel, defaults }: PrincipleFormProps) {
  const isEditing = Boolean(defaults);

  return (
    <ConfirmedForm
      action={action}
      className="grid gap-5"
      confirmation={{
        title: isEditing ? "Save principle changes?" : "Create this principle?",
        description: isEditing
          ? "This will update the principle and its visibility."
          : "This will add a new principle to the admin content library.",
        confirmLabel: submitLabel,
      }}
    >
      <div className="grid gap-4">
        {defaults ? <input type="hidden" name="id" value={defaults.id} /> : null}
        <Field label="Title" name="title" required defaultValue={defaults?.title} />
        <Field
          label="Slug"
          name="slug"
          required
          placeholder="simplify-complexity"
          defaultValue={defaults?.slug}
        />
        <StatusSelect defaultValue={defaults?.status} />
        <Field
          label="Position"
          name="position"
          type="number"
          defaultValue={defaults ? String(defaults.position) : undefined}
        />
        <TextArea label="Summary" name="summary" rows={4} defaultValue={defaults?.summary} />
        <TextArea label="Body" name="body" rows={8} defaultValue={defaults?.body} />
        <SeoFields defaults={defaults} />
        <SubmitButton label={submitLabel} />
      </div>
    </ConfirmedForm>
  );
}
