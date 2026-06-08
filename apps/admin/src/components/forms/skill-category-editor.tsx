"use client";

import { Pencil, Trash2 } from "lucide-react";

import { bulkUpsertSkillsAction, deleteSkillsAction } from "@/app/actions";
import { ConfirmedForm } from "@/components/confirmed-form";
import { ModalPanel } from "@/components/modal-panel";

import { BulkSkillsForm, type BulkSkillRow } from "./bulk-skills-form";

export interface SkillCategoryEditorData {
  rows: BulkSkillRow[];
  /** Category applied to new rows ("" for the Uncategorized group). */
  defaultCategory: string;
}

/**
 * Per-category actions shown in each skill group header:
 *  - a pen icon that opens the bulk editor scoped to the category (edit existing
 *    skills, or add a new sub-skill with "Add skill"); and
 *  - a trash icon that deletes the whole group after a danger confirmation.
 *
 * Receives only serializable props (group name + plain data) so a server page
 * can wire it into the client ContentList without passing rendered elements
 * across the server/client boundary.
 */
export function SkillCategoryEditor({
  groupName,
  data,
}: {
  groupName: string;
  data: SkillCategoryEditorData;
}) {
  const count = data.rows.length;

  return (
    <>
      <ModalPanel
        triggerLabel={`Edit ${groupName} skills`}
        title={`Edit ${groupName} skills`}
        description={`Bulk-edit skills in ${groupName}, or add a new one to this category with "Add skill".`}
        size="xl"
        triggerClassName="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-white/[0.06] hover:text-ink"
        triggerContent={<Pencil className="size-3.5" aria-hidden />}
      >
        <BulkSkillsForm
          action={bulkUpsertSkillsAction}
          submitLabel={`Save ${groupName} Skills`}
          defaultCategory={data.defaultCategory}
          initialRows={data.rows}
        />
      </ModalPanel>

      <ConfirmedForm
        action={deleteSkillsAction}
        className="inline-flex"
        confirmation={{
          title: `Delete the ${groupName} group?`,
          description: `This permanently deletes all ${count} skill${count === 1 ? "" : "s"} in ${groupName}. This cannot be undone.`,
          confirmLabel: `Delete ${groupName}`,
          cancelLabel: "Cancel",
          tone: "danger",
        }}
      >
        {data.rows.map((row) => (
          <input key={row.key} type="hidden" name="ids" value={row.key} />
        ))}
        <button
          type="submit"
          aria-label={`Delete ${groupName} skill group`}
          title={`Delete ${groupName} group`}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-rose-500/15 hover:text-rose-200"
        >
          <Trash2 className="size-3.5" aria-hidden />
        </button>
      </ConfirmedForm>
    </>
  );
}
