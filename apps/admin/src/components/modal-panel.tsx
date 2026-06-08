"use client";

import { X } from "lucide-react";
import { useId, useRef, type ReactNode } from "react";

type ModalSize = "sm" | "md" | "lg" | "xl";
type TriggerVariant = "primary" | "secondary";

interface ModalPanelProps {
  triggerLabel: string;
  title: string;
  children: ReactNode;
  description?: string | undefined;
  size?: ModalSize | undefined;
  triggerContent?: ReactNode | undefined;
  triggerDisabled?: boolean | undefined;
  triggerVariant?: TriggerVariant | undefined;
  /** Fully replaces the variant classes — used for icon / dashed "add" / gear triggers. */
  triggerClassName?: string | undefined;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "w-[min(calc(100vw-2rem),32rem)]",
  md: "w-[min(calc(100vw-2rem),42rem)]",
  lg: "w-[min(calc(100vw-2rem),56rem)]",
  xl: "w-[min(calc(100vw-2rem),72rem)]",
};

const triggerClasses: Record<TriggerVariant, string> = {
  primary: "ui-btn-primary",
  secondary: "ui-btn-secondary",
};

export function ModalPanel({
  triggerLabel,
  title,
  description,
  children,
  size = "md",
  triggerContent,
  triggerDisabled = false,
  triggerVariant = "primary",
  triggerClassName,
}: ModalPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <>
      <button
        type="button"
        className={`${triggerClassName ?? triggerClasses[triggerVariant]} disabled:cursor-not-allowed disabled:opacity-40`}
        aria-label={triggerContent ? triggerLabel : undefined}
        disabled={triggerDisabled}
        title={triggerContent ? triggerLabel : undefined}
        onClick={() => dialogRef.current?.showModal()}
      >
        {triggerContent ?? triggerLabel}
      </button>
      <dialog
        ref={dialogRef}
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        className={`${sizeClasses[size]} max-h-[calc(100vh-2rem)] overflow-hidden rounded-2xl border border-line-strong bg-surface p-0 text-ink shadow-pop outline-none backdrop:bg-black/70 backdrop:backdrop-blur-sm`}
      >
        <div className="flex max-h-[calc(100vh-2rem)] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-line bg-white/[0.02] px-6 py-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-base font-semibold text-ink">
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
              className="-mr-1.5 -mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-white/[0.06] hover:text-ink"
              aria-label={`Close ${title}`}
              onClick={() => dialogRef.current?.close()}
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
        </div>
      </dialog>
    </>
  );
}
