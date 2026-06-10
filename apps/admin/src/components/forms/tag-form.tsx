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

/**
 * Quick-create tag form, kept as a compact modal (tags are lightweight taxonomy).
 * Saves directly — success is confirmed by the flash toast after the redirect.
 * Field names match `createTagAction`.
 */
export function TagForm({ action, submitLabel, defaults }: TagFormProps) {
  return (
    <ConfirmedForm action={action} confirm="off" className="grid gap-5">
      <div className="grid gap-4">
        {defaults ? <input type="hidden" name="id" value={defaults.id} /> : null}
        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
        <SubmitButton label={submitLabel} />
      </div>
    </ConfirmedForm>
  );
}
