"use client";

import { useContext } from "react";

import { FormValidityContext } from "@/components/confirmed-form";

/**
 * Primary submit button for {@link ConfirmedForm}. Disables itself while the
 * enclosing form is invalid (unfilled required fields, or a custom `valid={…}`
 * signal), so saving is only possible once the form is complete.
 */
export function SubmitButton({ label }: { label: string }) {
  const canSubmit = useContext(FormValidityContext);

  return (
    <button className="ui-btn-primary" type="submit" disabled={!canSubmit}>
      {label}
    </button>
  );
}
