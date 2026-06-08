"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { ConfirmedForm } from "@/components/confirmed-form";
import { SubmitButton, statusOptions } from "@/components/form-controls";

import type { FormAction } from "./types";

export interface BulkSkillRow {
  /** Stable React key (record id for existing rows, generated id for new ones). */
  key: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  summary: string;
  position: string;
}

interface BulkSkillsFormProps {
  action: FormAction;
  submitLabel: string;
  initialRows: BulkSkillRow[];
  /** Category pre-filled on new rows — used by the per-category group editors. */
  defaultCategory?: string;
}

/** Compact cell input, denser than the standard `ui-input` to fit the grid. */
const CELL =
  "w-full min-w-0 rounded-lg border border-line bg-white/[0.03] px-2.5 py-1.5 text-sm text-ink outline-none transition placeholder:text-muted/50 focus:border-teal-300/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-teal-300/15";

/** Shared 7-column template so the header and every row line up. */
const GRID =
  "grid grid-cols-[minmax(8rem,1.2fr)_minmax(7rem,1fr)_minmax(5.5rem,0.8fr)_8rem_minmax(9rem,1.4fr)_4.5rem_1.75rem] items-center gap-2";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Strip the row/column delimiters so values survive the pipe-encoded payload. */
function sanitizeField(value: string): string {
  return value.replace(/\r?\n/g, " ").replace(/\|/g, "/").trim();
}

function emptyRow(key: string, category = ""): BulkSkillRow {
  return { key, name: "", slug: "", category, status: "draft", summary: "", position: "" };
}

/**
 * Spreadsheet-style bulk editor for skills. Rows are edited inline with real
 * inputs (instead of a raw pipe-delimited textarea) and serialized back into the
 * `items` payload the existing `bulkUpsertSkillsAction` already parses, so the
 * server contract is unchanged.
 */
export function BulkSkillsForm({
  action,
  submitLabel,
  initialRows,
  defaultCategory = "",
}: BulkSkillsFormProps) {
  const newKeySeq = useRef(0);
  const [rows, setRows] = useState<BulkSkillRow[]>(() =>
    initialRows.length > 0 ? initialRows : [emptyRow("new-0", defaultCategory)],
  );

  const nextKey = () => {
    newKeySeq.current += 1;
    return `new-${newKeySeq.current}`;
  };

  const serialized = useMemo(
    () =>
      rows
        .filter((row) => row.name.trim().length > 0)
        .map((row, index) =>
          [
            sanitizeField(row.name),
            sanitizeField(row.slug) || slugify(row.name),
            sanitizeField(row.category),
            row.status || "draft",
            sanitizeField(row.summary),
            sanitizeField(row.position) || String(index),
          ].join(" | "),
        )
        .join("\n"),
    [rows],
  );

  function updateRow(key: string, patch: Partial<BulkSkillRow>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function handleNameChange(row: BulkSkillRow, name: string) {
    // Keep auto-filling the slug only while the user hasn't hand-edited it.
    const tracksName = row.slug === "" || row.slug === slugify(row.name);
    updateRow(row.key, tracksName ? { name, slug: slugify(name) } : { name });
  }

  function addRow() {
    setRows((current) => [...current, emptyRow(nextKey(), defaultCategory)]);
  }

  function removeRow(key: string) {
    setRows((current) => {
      const next = current.filter((row) => row.key !== key);
      return next.length > 0 ? next : [emptyRow(nextKey(), defaultCategory)];
    });
  }

  const filledCount = rows.filter((row) => row.name.trim().length > 0).length;

  return (
    <ConfirmedForm
      action={action}
      className="grid gap-4"
      valid={filledCount > 0}
      confirmation={{
        title: "Save bulk changes?",
        description:
          "This creates new rows and updates existing rows that match the listed slugs. Empty rows are ignored.",
        confirmLabel: submitLabel,
      }}
    >
      <input type="hidden" name="items" value={serialized} />

      <p className="text-xs leading-5 text-muted">
        Edit skills inline. Existing slugs are updated; new slugs are created. Leave the slug blank
        to derive it from the name.
      </p>

      <div className="overflow-x-auto">
        <div className="min-w-[52rem] space-y-2">
          <div
            className={`${GRID} px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted/60`}
          >
            <span>Name</span>
            <span>Slug</span>
            <span>Category</span>
            <span>Status</span>
            <span>Summary</span>
            <span>Order</span>
            <span className="sr-only">Remove</span>
          </div>

          {rows.map((row) => (
            <div key={row.key} className={GRID}>
              <input
                aria-label="Name"
                className={CELL}
                value={row.name}
                placeholder="TypeScript"
                onChange={(event) => handleNameChange(row, event.target.value)}
              />
              <input
                aria-label="Slug"
                className={CELL}
                value={row.slug}
                placeholder="typescript"
                onChange={(event) => updateRow(row.key, { slug: event.target.value })}
              />
              <input
                aria-label="Category"
                className={CELL}
                value={row.category}
                placeholder="Languages"
                onChange={(event) => updateRow(row.key, { category: event.target.value })}
              />
              <select
                aria-label="Status"
                className="ui-select py-1.5 pl-2.5"
                value={row.status}
                onChange={(event) => updateRow(row.key, { status: event.target.value })}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                aria-label="Summary"
                className={CELL}
                value={row.summary}
                placeholder="Short summary"
                onChange={(event) => updateRow(row.key, { summary: event.target.value })}
              />
              <input
                aria-label="Order"
                inputMode="numeric"
                className={`${CELL} text-center`}
                value={row.position}
                placeholder="0"
                onChange={(event) => updateRow(row.key, { position: event.target.value })}
              />
              <button
                type="button"
                aria-label={`Remove ${row.name || "row"}`}
                title="Remove row"
                onClick={() => removeRow(row.key)}
                className="flex size-7 items-center justify-center rounded-lg text-muted transition hover:bg-rose-500/15 hover:text-rose-200"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={addRow} className="ui-btn-ghost">
          <Plus className="size-4" aria-hidden /> Add skill{defaultCategory ? ` to ${defaultCategory}` : ""}
        </button>
        <span className="text-xs tabular-nums">
          {filledCount === 0 ? (
            <span className="text-amber-200/90">Add at least one named skill to save</span>
          ) : (
            <span className="text-muted">
              {filledCount} skill{filledCount === 1 ? "" : "s"}
            </span>
          )}
        </span>
      </div>

      <SubmitButton label={submitLabel} />
    </ConfirmedForm>
  );
}
