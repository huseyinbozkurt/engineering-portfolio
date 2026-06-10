"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

import { useDirtyState } from "@/components/providers/dirty-state";
import type { FormAction } from "@/components/forms/types";

/**
 * Whether the enclosing {@link ConfirmedForm} currently passes validation.
 * {@link SubmitButton} reads this to disable itself until the form is complete,
 * so every confirmed form gets validation-based save enablement for free.
 */
export const FormValidityContext = createContext(true);

/**
 * Whether the enclosing form has unsaved changes (only meaningful when the form
 * opts into `trackDirty`). {@link SaveBar} reads this to show the dirty/saved
 * indicator and enable the Save action.
 */
export const FormDirtyContext = createContext(false);

type ConfirmTone = "default" | "danger";

/** `"always"` keeps the confirm dialog; `"off"` saves directly + toasts. */
type ConfirmMode = "always" | "off";

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
   * Whether to gate submission behind a confirm dialog. Defaults to `"always"`
   * (preserves the original behavior for create/update/delete). Detail-page
   * section edits and the homepage builder pass `"off"` for a frictionless,
   * toast-confirmed save.
   */
  confirm?: ConfirmMode;
  /**
   * Extra validity signal beyond native HTML constraints — for dynamic forms
   * with no `required` inputs (e.g. the bulk skills editor needs at least one
   * row). The submit button stays disabled unless this is true AND the form's
   * native constraints pass. Defaults to `true`.
   */
  valid?: boolean;
  /**
   * Track unsaved changes: snapshots the form on mount, flags dirty on edits,
   * and registers with the app-level {@link useDirtyState} guard so navigating
   * away warns. Used by full-page editors with a {@link SaveBar}.
   */
  trackDirty?: boolean;
  /**
   * Runs after a non-redirecting action resolves (e.g. inline patch saves) —
   * typically a success toast. Redirecting actions navigate away before this
   * fires; surface their success via the flash cookie instead.
   */
  onSuccess?: () => void;
}

const defaultConfirmation: ConfirmationCopy = {
  title: "Save this change?",
  description: "Review the fields before confirming. This will update the admin data.",
  confirmLabel: "Confirm save",
  cancelLabel: "Keep editing",
  tone: "default",
};

/** Stable, File-safe serialization of a form's current values for dirty checks. */
function serializeForm(form: HTMLFormElement): string {
  const parts: string[] = [];
  for (const [key, value] of new FormData(form).entries()) {
    parts.push(`${key}=${typeof value === "string" ? value : ""}`);
  }
  return parts.join("&");
}

export function ConfirmedForm({
  action,
  children,
  confirmation,
  confirm = "always",
  className,
  valid = true,
  trackDirty = false,
  onSuccess,
  ...props
}: ConfirmedFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const allowSubmitRef = useRef(false);
  const initialSnapshot = useRef<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nativeValid, setNativeValid] = useState(true);
  const [dirty, setDirty] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const dirtyKey = useId();
  const copy = { ...defaultConfirmation, ...confirmation };
  const dirtyState = useDirtyState();

  // Track native HTML constraint validity (required fields, url/email types, …)
  // so the submit button can disable itself until the form is complete. Listens
  // on the form so dynamically added inputs are covered via event bubbling.
  useEffect(() => {
    const form = formRef.current;
    if (!form) {
      return;
    }

    const update = () => {
      setNativeValid(form.checkValidity());
      if (trackDirty) {
        setDirty(serializeForm(form) !== initialSnapshot.current);
      }
    };

    if (trackDirty) {
      initialSnapshot.current = serializeForm(form);
    }
    update();
    form.addEventListener("input", update);
    form.addEventListener("change", update);

    return () => {
      form.removeEventListener("input", update);
      form.removeEventListener("change", update);
    };
  }, [trackDirty]);

  // Mirror local dirty state into the app-level guard so leaving the page warns.
  useEffect(() => {
    if (!trackDirty) {
      return;
    }
    dirtyState.setDirty(dirtyKey, dirty);
    return () => dirtyState.setDirty(dirtyKey, false);
  }, [trackDirty, dirty, dirtyKey, dirtyState]);

  const canSubmit = valid && nativeValid;

  // Wrap the server action so success housekeeping (clear dirty, close an
  // enclosing edit modal, toast) runs after it resolves. Redirecting actions
  // throw internally (NEXT_REDIRECT) and skip the success tail — their feedback
  // arrives via the flash cookie — but the `finally` still closes an enclosing
  // modal so it doesn't linger over the refreshed page.
  const runAction = useCallback(
    async (formData: FormData) => {
      try {
        await action(formData);
      } finally {
        setIsSubmitting(false);
        const dialog = formRef.current?.closest("dialog");
        if (dialog instanceof HTMLDialogElement && dialog.open) {
          dialog.close();
        }
      }
      const form = formRef.current;
      if (form && trackDirty) {
        initialSnapshot.current = serializeForm(form);
      }
      setDirty(false);
      dirtyState.setDirty(dirtyKey, false);
      onSuccess?.();
    },
    [action, trackDirty, dirtyState, dirtyKey, onSuccess],
  );

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
      <FormDirtyContext.Provider value={dirty}>
        <form
          {...props}
          ref={formRef}
          action={runAction}
          className={className}
          onSubmit={(event) => {
            // Relaxed mode: submit straight through (toast / flash confirms).
            if (confirm === "off") {
              setIsSubmitting(true);
              return;
            }

            // Confirm mode: the real submit only happens after the dialog's
            // confirm button calls requestSubmit() and flips this flag.
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
      </FormDirtyContext.Provider>
      {confirm === "always" ? (
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
                className={copy.tone === "danger" ? "ui-btn-danger" : "ui-btn-primary"}
                disabled={isSubmitting}
                onClick={confirmSubmit}
              >
                {isSubmitting ? "Saving..." : copy.confirmLabel}
              </button>
            </div>
          </div>
        </dialog>
      ) : null}
    </FormValidityContext.Provider>
  );
}
