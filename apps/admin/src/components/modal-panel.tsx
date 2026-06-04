"use client";

import { useId, useRef, type ReactNode } from "react";

type ModalSize = "sm" | "md" | "lg" | "xl";
type TriggerVariant = "primary" | "secondary";

interface ModalPanelProps {
  triggerLabel: string;
  title: string;
  children: ReactNode;
  description?: string;
  size?: ModalSize;
  triggerVariant?: TriggerVariant;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "w-[min(calc(100vw-2rem),32rem)]",
  md: "w-[min(calc(100vw-2rem),42rem)]",
  lg: "w-[min(calc(100vw-2rem),56rem)]",
  xl: "w-[min(calc(100vw-2rem),72rem)]",
};

const triggerClasses: Record<TriggerVariant, string> = {
  primary:
    "rounded-lg bg-teal-200 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-teal-100",
  secondary:
    "rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:border-teal-300/50 hover:bg-white/[0.06]",
};

export function ModalPanel({
  triggerLabel,
  title,
  description,
  children,
  size = "md",
  triggerVariant = "primary",
}: ModalPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <>
      <button
        type="button"
        className={triggerClasses[triggerVariant]}
        onClick={() => dialogRef.current?.showModal()}
      >
        {triggerLabel}
      </button>
      <dialog
        ref={dialogRef}
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        className={`${sizeClasses[size]} max-h-[calc(100vh-2rem)] overflow-hidden rounded-lg border border-line bg-[#090b0f] p-0 text-ink shadow-2xl outline-none backdrop:bg-black/75`}
      >
        <div className="flex max-h-[calc(100vh-2rem)] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-line bg-[#090b0f] px-5 py-4">
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-ink">
                {title}
              </h2>
              {description ? (
                <p id={descriptionId} className="mt-1 text-sm leading-6 text-muted">
                  {description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className="rounded-md border border-line px-2.5 py-1 text-xs font-semibold text-muted transition hover:border-teal-300/50 hover:text-ink"
              aria-label={`Close ${title}`}
              onClick={() => dialogRef.current?.close()}
            >
              Close
            </button>
          </div>
          <div className="overflow-y-auto px-5 py-5">{children}</div>
        </div>
      </dialog>
    </>
  );
}
