import { ConfirmedForm } from "@/components/confirmed-form";
import { SubmitButton, TextArea } from "@/components/form-controls";

import type { FormAction } from "./types";

interface BulkTaxonomyFormProps {
  action: FormAction;
  title: string;
  fieldGuide: string;
  defaultValue: string;
  placeholder: string;
  submitLabel: string;
}

export function BulkTaxonomyForm({
  action,
  title,
  fieldGuide,
  defaultValue,
  placeholder,
  submitLabel,
}: BulkTaxonomyFormProps) {
  return (
    <ConfirmedForm
      action={action}
      className="grid gap-5"
      confirmation={{
        title: "Save bulk changes?",
        description: "This will create new rows and update existing rows that match the listed slugs.",
        confirmLabel: submitLabel,
      }}
    >
      <p className="text-xs leading-5 text-muted">{fieldGuide}</p>
      <div className="grid gap-4">
        <TextArea
          label="Rows"
          name="items"
          rows={12}
          placeholder={placeholder}
          defaultValue={defaultValue}
        />
        <SubmitButton label={submitLabel} />
      </div>
    </ConfirmedForm>
  );
}
