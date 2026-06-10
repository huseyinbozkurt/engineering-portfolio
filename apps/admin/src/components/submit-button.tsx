"use client";

import { useContext } from "react";
import { useFormStatus } from "react-dom";

import { FormValidityContext } from "@/components/confirmed-form";

/**
 * Primary submit button for {@link ConfirmedForm}. Disables itself while the
 * enclosing form is invalid (unfilled required fields, or a custom `valid={…}`
 * signal) and reflects the in-flight submission via `useFormStatus`, so saving is
 * only possible once the form is complete and the button shows progress.
 */
export function SubmitButton({ label }: { label: string }) {
  const canSubmit = useContext(FormValidityContext);
  const { pending } = useFormStatus();

  return (
    <button className="ui-btn-primary" type="submit" disabled={!canSubmit || pending}>
      {pending ? "Saving…" : label}
    </button>
  );
}
