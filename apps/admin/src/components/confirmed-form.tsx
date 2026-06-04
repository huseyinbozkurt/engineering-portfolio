"use client";

import { useId, useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";

import type { FormAction } from "@/components/forms/types";

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
  ...props
}: ConfirmedFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const allowSubmitRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const copy = { ...defaultConfirmation, ...confirmation };

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
    <>
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
        className="w-[min(calc(100vw-2rem),28rem)] rounded-lg border border-line bg-[#090b0f] p-0 text-ink shadow-2xl outline-none backdrop:bg-black/75"
        onCancel={() => setIsSubmitting(false)}
      >
        <div className="p-5">
          <h2 id={titleId} className="text-lg font-semibold text-ink">
            {copy.title}
          </h2>
          <p id={descriptionId} className="mt-2 text-sm leading-6 text-muted">
            {copy.description}
          </p>
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:border-teal-300/50 hover:bg-white/[0.06]"
              onClick={closeDialog}
            >
              {copy.cancelLabel}
            </button>
            <button
              type="button"
              className={
                copy.tone === "danger"
                  ? "rounded-lg border border-rose-300/50 bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/25"
                  : "rounded-lg bg-teal-200 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-teal-100"
              }
              disabled={isSubmitting}
              onClick={confirmSubmit}
            >
              {isSubmitting ? "Saving..." : copy.confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
