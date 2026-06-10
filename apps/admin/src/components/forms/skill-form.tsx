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

/**
 * Quick-create skill form, kept as a compact modal (skills are taxonomy entries,
 * not documents). Saves directly — success is confirmed by the flash toast after
 * the redirect. Field names match `createSkillAction`.
 */
export function SkillForm({ action, submitLabel, defaults }: SkillFormProps) {
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
            placeholder="typescript"
            defaultValue={defaults?.slug}
          />
          <Field
            label="Category"
            name="category"
            placeholder="Languages"
            defaultValue={defaults?.category ?? undefined}
          />
          <StatusSelect defaultValue={defaults?.status} />
        </div>
        <TextArea label="Summary" name="summary" rows={3} defaultValue={defaults?.summary} />
        <Field
          label="Order (lower shows first)"
          name="position"
          type="number"
          defaultValue={defaults ? String(defaults.position) : undefined}
        />
        <SubmitButton label={submitLabel} />
      </div>
    </ConfirmedForm>
  );
}
