"use client";

import { CheckCircle2, ExternalLink } from "lucide-react";
import { useContext, useEffect, useRef, type RefObject } from "react";
import { useFormStatus } from "react-dom";

import { FormDirtyContext, FormValidityContext } from "@/components/confirmed-form";
import { Breadcrumbs } from "@/components/nav/breadcrumbs";

interface SaveBarProps {
  title: string;
  /** e.g. "Updated 2 days ago" — shown when the form is clean. */
  lastUpdatedLabel?: string | undefined;
  /** Public URL for a "View on site" affordance. */
  previewHref?: string | null | undefined;
  saveLabel?: string;
  /** Create mode: the clean state reads "Not saved yet" instead of "All changes saved". */
  isNew?: boolean;
}

function isMac(): boolean {
  return typeof navigator !== "undefined" && /Mac|iP(hone|ad|od)/.test(navigator.platform);
}

function SaveButton({
  label,
  buttonRef,
}: {
  label: string;
  buttonRef: RefObject<HTMLButtonElement | null>;
}) {
  const { pending } = useFormStatus();
  const dirty = useContext(FormDirtyContext);
  const valid = useContext(FormValidityContext);
  return (
    <button
      ref={buttonRef}
      type="submit"
      disabled={pending || !valid || !dirty}
      className="ui-btn-primary"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

/**
 * Sticky editor header for full-page forms. Reads the enclosing
 * {@link ConfirmedForm}'s dirty + validity context to show a live save state and
 * gate the Save button, and binds Cmd/Ctrl+S to submit. Must be rendered inside
 * a `ConfirmedForm` with `trackDirty`.
 */
export function SaveBar({
  title,
  lastUpdatedLabel,
  previewHref,
  saveLabel = "Save changes",
  isNew = false,
}: SaveBarProps) {
  const dirty = useContext(FormDirtyContext);
  const valid = useContext(FormValidityContext);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (dirty && valid) {
          buttonRef.current?.form?.requestSubmit();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dirty, valid]);

  return (
    <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-line bg-surface/85 px-5 py-3.5 backdrop-blur lg:px-8">
      <div className="min-w-0">
        <Breadcrumbs className="mb-1" />
        <h1 className="ui-page-title text-xl sm:text-2xl">{title}</h1>
        <div className="mt-1 flex items-center gap-1.5 text-xs">
          {dirty ? (
            <>
              <span className="size-1.5 rounded-full bg-warning-300" aria-hidden />
              <span className="font-medium text-warning-100">Unsaved changes</span>
              <span className="text-muted/60">
                · {isMac() ? "⌘" : "Ctrl"}S to save
              </span>
            </>
          ) : isNew ? (
            <>
              <span className="size-1.5 rounded-full bg-white/30" aria-hidden />
              <span className="text-muted">Not saved yet</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="size-3.5 text-success-300" aria-hidden />
              <span className="text-muted">
                {lastUpdatedLabel ? lastUpdatedLabel : "All changes saved"}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        {previewHref ? (
          <a
            href={previewHref}
            target="_blank"
            rel="noreferrer"
            className="ui-btn-secondary"
          >
            View on site <ExternalLink className="size-3.5" aria-hidden />
          </a>
        ) : null}
        <SaveButton label={saveLabel} buttonRef={buttonRef} />
      </div>
    </div>
  );
}
