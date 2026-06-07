import { Pencil, Plus } from "lucide-react";
import type { ReactNode } from "react";

import { ModalPanel } from "@/components/modal-panel";
import type { FormAction } from "@/components/forms/types";

import { RichTextView } from "./rich-text-view";
import { SectionEditForm } from "./section-edit-form";

type ModalSize = "sm" | "md" | "lg" | "xl";

interface SectionCardProps {
  title: string;
  id: string;
  action: FormAction;
  /** Field manifest this section edits (passed straight to the patch action). */
  fields: string | readonly string[];
  /** The form control(s) shown inside the edit / add modal. */
  formFields: ReactNode;
  /** Single-field content used to detect emptiness and render a default preview. */
  value?: string;
  /** Explicit emptiness override for multi-field sections (e.g. architecture). */
  isEmpty?: boolean;
  /** Custom filled-state preview; defaults to markdown of `value`. */
  preview?: ReactNode;
  addLabel?: string;
  modalSize?: ModalSize;
  modalDescription?: string;
  submitLabel?: string;
  /** Optional helper text under the heading (filled state). */
  eyebrow?: string;
}

/**
 * A content section on a detail page that mirrors the public layout while being
 * editable. When the section has content it renders the content with a small
 * "Edit" affordance; when empty it renders a dashed "+ Add {section}" card *in
 * the place the section would occupy*, so the structure of the public page is
 * always visible. Both states open the same focused edit modal.
 */
export function SectionCard({
  title,
  id,
  action,
  fields,
  formFields,
  value,
  isEmpty,
  preview,
  addLabel,
  modalSize = "lg",
  modalDescription,
  submitLabel = "Save changes",
  eyebrow,
}: SectionCardProps) {
  const empty = isEmpty ?? !(value && value.trim().length > 0);

  const form = (
    <SectionEditForm action={action} id={id} fields={fields} submitLabel={submitLabel}>
      {formFields}
    </SectionEditForm>
  );

  if (empty) {
    return (
      <ModalPanel
        title={`Add ${title}`}
        description={modalDescription}
        triggerLabel={`Add ${title}`}
        size={modalSize}
        triggerClassName="flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-line bg-white/[0.015] px-4 py-9 text-center text-sm font-medium text-muted transition hover:border-teal-300/50 hover:bg-white/[0.03] hover:text-ink"
        triggerContent={
          <>
            <span className="flex size-8 items-center justify-center rounded-full border border-line text-muted">
              <Plus className="size-4" />
            </span>
            {addLabel ?? `Add ${title.toLowerCase()}`}
          </>
        }
      >
        {form}
      </ModalPanel>
    );
  }

  return (
    <section className="rounded-lg border border-line bg-white/[0.025] p-6 lg:p-8">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink">{title}</h2>
          {eyebrow ? <p className="mt-1 text-xs text-muted">{eyebrow}</p> : null}
        </div>
        <ModalPanel
          title={`Edit ${title}`}
          description={modalDescription}
          triggerLabel={`Edit ${title}`}
          size={modalSize}
          triggerClassName="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-xs font-medium text-muted transition hover:border-teal-300/50 hover:text-ink"
          triggerContent={
            <>
              <Pencil className="size-3.5" /> Edit
            </>
          }
        >
          {form}
        </ModalPanel>
      </div>
      {preview ?? <RichTextView value={value ?? ""} />}
    </section>
  );
}
