"use client";

import { ConfirmedForm } from "@/components/confirmed-form";

interface DeleteFormProps {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  label: string;
  confirmMessage?: string;
}

/**
 * Standalone delete form. Lives in its own (client) component so it can ask for
 * confirmation before invoking the server action — keeping the surrounding edit
 * forms as server components.
 */
export function DeleteForm({
  action,
  id,
  label,
  confirmMessage = "Delete this record permanently? This cannot be undone.",
}: DeleteFormProps) {
  return (
    <ConfirmedForm
      action={action}
      confirmation={{
        title: "Delete this record?",
        description: confirmMessage,
        confirmLabel: label,
        cancelLabel: "Cancel",
        tone: "danger",
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="ui-btn-danger">
        {label}
      </button>
    </ConfirmedForm>
  );
}
