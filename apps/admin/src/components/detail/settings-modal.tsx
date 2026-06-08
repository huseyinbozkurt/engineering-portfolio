import { Settings } from "lucide-react";
import type { ReactNode } from "react";

import { ModalPanel } from "@/components/modal-panel";
import type { FormAction } from "@/components/forms/types";

import { SectionEditForm } from "./section-edit-form";

type ModalSize = "sm" | "md" | "lg" | "xl";

interface SettingsModalProps {
  id: string;
  action: FormAction;
  /** Every non-visual field name this modal owns (slug, order, relations, SEO…). */
  fields: string | readonly string[];
  children: ReactNode;
  size?: ModalSize;
  description?: string;
}

/**
 * The gear/settings modal: holds the record's non-viewable configuration —
 * slug, ordering, relationships, and SEO — i.e. everything that isn't rendered
 * as a section on the public page. Triggered by a gear icon in the detail
 * header.
 */
export function SettingsModal({
  id,
  action,
  fields,
  children,
  size = "lg",
  description,
}: SettingsModalProps) {
  return (
    <ModalPanel
      title="Settings"
      description={
        description ??
        "Slug, ordering, relationships, and SEO. These aren't shown as page sections."
      }
      triggerLabel="Open settings"
      size={size}
      triggerClassName="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white/[0.02] px-3 py-2 text-sm font-medium text-ink transition hover:border-line-strong hover:bg-white/[0.06]"
      triggerContent={
        <>
          <Settings className="size-4" /> Settings
        </>
      }
    >
      <SectionEditForm
        action={action}
        id={id}
        fields={fields}
        submitLabel="Save settings"
        confirmTitle="Save settings?"
        confirmDescription="Updates slug, ordering, relationships, and SEO for this record."
      >
        {children}
      </SectionEditForm>
    </ModalPanel>
  );
}
