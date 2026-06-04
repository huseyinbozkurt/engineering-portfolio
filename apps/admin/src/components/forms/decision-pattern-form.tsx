import type { DecisionPatternEditRecord } from "@portfolio/db/queries";

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

interface DecisionPatternFormProps {
  action: FormAction;
  title: string;
  submitLabel: string;
  principleOptions: RelationOption[];
  defaults?: DecisionPatternEditRecord | undefined;
}

export function DecisionPatternForm({
  action,
  title,
  submitLabel,
  principleOptions,
  defaults,
}: DecisionPatternFormProps) {
  const isEditing = Boolean(defaults);

  return (
    <ConfirmedForm
      action={action}
      className="grid gap-5"
      confirmation={{
        title: isEditing ? "Save pattern changes?" : "Create this decision pattern?",
        description: isEditing
          ? "This will update the decision pattern and its related principles."
          : "This will add a new decision pattern to the admin content library.",
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
          placeholder="reduce-risk-early"
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
        <CheckboxGroup
          label="Related principles"
          name="principleIds"
          emptyLabel="No principles available."
          options={principleOptions}
          selectedIds={defaults?.principleIds}
        />
        <SeoFields defaults={defaults} />
        <SubmitButton label={submitLabel} />
      </div>
    </ConfirmedForm>
  );
}
