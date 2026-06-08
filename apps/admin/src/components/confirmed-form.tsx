"use client";

import {
  createContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

import type { FormAction } from "@/components/forms/types";

/**
 * Whether the enclosing {@link ConfirmedForm} currently passes validation.
 * {@link SubmitButton} reads this to disable itself until the form is complete,
 * so every confirmed form gets validation-based save enablement for free.
 */
export const FormValidityContext = createContext(true);

type ConfirmTone = "default" | "danger";

interface ConfirmationCopy {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
}

interface ConfirmedFormProps
  extends Omit<ComponentPropsWithoutRef<"form">, "action" | "children" | "onSubmit"> {
  action: FormAction;
  children: ReactNode;
  confirmation?: Partial<ConfirmationCopy>;
  /**
   * Extra validity signal beyond native HTML constraints — for dynamic forms
   * with no `required` inputs (e.g. the bulk skills editor needs at least one
   * row). The submit button stays disabled unless this is true AND the form's
   * native constraints pass. Defaults to `true`.
   */
  valid?: boolean;
}

const defaultConfirmation: ConfirmationCopy = {
  title: "Save this change?",
  description: "Review the fields before confirming. This will update the admin data.",
  confirmLabel: "Confirm save",
  cancelLabel: "Keep editing",
  tone: "default",
};

export function ConfirmedForm({
  action,
  children,
  confirmation,
  className,
  valid = true,
  ...props
}: ConfirmedFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const allowSubmitRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nativeValid, setNativeValid] = useState(true);
  const titleId = useId();
  const descriptionId = useId();
  const copy = { ...defaultConfirmation, ...confirmation };

  // Track native HTML constraint validity (required fields, url/email types, …)
  // so the submit button can disable itself until the form is complete. Listens
  // on the form so dynamically added inputs are covered via event bubbling.
  useEffect(() => {
    const form = formRef.current;
    if (!form) {
      return;
    }

    const update = () => setNativeValid(form.checkValidity());
    update();
    form.addEventListener("input", update);
    form.addEventListener("change", update);

    return () => {
      form.removeEventListener("input", update);
      form.removeEventListener("change", update);
    };
  }, []);

  const canSubmit = valid && nativeValid;

  function closeDialog() {
    dialogRef.current?.close();
    setIsSubmitting(false);
  }

  function confirmSubmit() {
    allowSubmitRef.current = true;
    dialogRef.current?.close();
    formRef.current?.requestSubmit();
  }

  return (
    <FormValidityContext.Provider value={canSubmit}>
      <form
        {...props}
        ref={formRef}
        action={action}
        className={className}
        onSubmit={(event) => {
          if (allowSubmitRef.current) {
            allowSubmitRef.current = false;
            setIsSubmitting(true);
            return;
          }

          event.preventDefault();

          if (dialogRef.current?.open) {
            return;
          }

          dialogRef.current?.showModal();
        }}
      >
        {children}
      </form>
      <dialog
        ref={dialogRef}
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className="w-[min(calc(100vw-2rem),28rem)] rounded-2xl border border-line-strong bg-surface p-0 text-ink shadow-pop outline-none backdrop:bg-black/70 backdrop:backdrop-blur-sm"
        onCancel={() => setIsSubmitting(false)}
      >
        <div className="p-6">
          <h2 id={titleId} className="text-base font-semibold text-ink">
            {copy.title}
          </h2>
          <p id={descriptionId} className="mt-2 text-sm leading-6 text-muted">
            {copy.description}
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-2.5">
            <button type="button" className="ui-btn-secondary" onClick={closeDialog}>
              {copy.cancelLabel}
            </button>
            <button
              type="button"
              className={
                copy.tone === "danger"
                  ? "inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-300/50 bg-rose-500/15 px-4 py-2.5 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                  : "ui-btn-primary"
              }
              disabled={isSubmitting}
              onClick={confirmSubmit}
            >
              {isSubmitting ? "Saving..." : copy.confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </FormValidityContext.Provider>
  );
}
