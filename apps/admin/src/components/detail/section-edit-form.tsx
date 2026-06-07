"use client";

import type { ReactNode } from "react";

import { ConfirmedForm } from "@/components/confirmed-form";
import { SubmitButton } from "@/components/form-controls";
import type { FormAction } from "@/components/forms/types";

interface SectionEditFormProps {
  action: FormAction;
  /** Record id; submitted as the hidden `id` field. */
  id: string;
  /**
   * The field names this form owns. Serialized into the hidden `__fields`
   * manifest so the patch action writes exactly these columns/relations and
   * leaves everything else on the record untouched.
   */
  fields: string | readonly string[];
  children: ReactNode;
  submitLabel?: string;
  confirmTitle?: string;
  confirmDescription?: string;
}

/**
 * Thin wrapper over {@link ConfirmedForm} for the per-section / settings edit
 * modals. Injects the hidden `id` + `__fields` inputs every patch action needs,
 * then renders the section's own field controls and a submit button.
 */
export function SectionEditForm({
  action,
  id,
  fields,
  children,
  submitLabel = "Save changes",
  confirmTitle,
  confirmDescription,
}: SectionEditFormProps) {
  const manifest = Array.isArray(fields) ? fields.join(" ") : (fields as string);

  return (
    <ConfirmedForm
      action={action}
      className="grid gap-5"
      confirmation={{
        title: confirmTitle ?? "Save this change?",
        description:
          confirmDescription ??
          "Only the fields in this section are updated. Everything else stays as-is.",
        confirmLabel: submitLabel,
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="__fields" value={manifest} />
      <div className="grid gap-4">{children}</div>
      <SubmitButton label={submitLabel} />
    </ConfirmedForm>
  );
}
