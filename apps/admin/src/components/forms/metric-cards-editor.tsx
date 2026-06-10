"use client";

import { GripVertical, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { HomepageMetric } from "@portfolio/validators";

interface MetricRow {
  id: number;
  value: string;
  label: string;
  detail: string;
}

const MAX = 6;
const LIMITS = { value: 80, label: 120, detail: 180 } as const;

/**
 * Visual editor for the homepage metric cards. Each metric is an editable card
 * (value / label / optional detail) with a live preview, add/remove, and native
 * drag-to-reorder. Serializes to the existing `value | label | detail` newline
 * rows the server already parses, enforcing the validator's max-6 + length caps.
 */
export function MetricCardsEditor({
  name,
  defaultMetrics,
}: {
  name: string;
  defaultMetrics: HomepageMetric[];
}) {
  const counter = useRef(0);
  const [rows, setRows] = useState<MetricRow[]>(() =>
    defaultMetrics.map((metric) => ({
      id: (counter.current += 1),
      value: metric.value,
      label: metric.label,
      detail: metric.detail ?? "",
    })),
  );
  const [dragId, setDragId] = useState<number | null>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);

  const serialized = rows
    .filter((row) => row.value.trim() && row.label.trim())
    .map((row) => {
      const base = `${row.value.trim()} | ${row.label.trim()}`;
      return row.detail.trim() ? `${base} | ${row.detail.trim()}` : base;
    })
    .join("\n");

  useEffect(() => {
    hiddenRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }, [serialized]);

  const patch = (id: number, key: keyof Omit<MetricRow, "id">, value: string) =>
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  const remove = (id: number) => setRows((prev) => prev.filter((row) => row.id !== id));
  const add = () =>
    setRows((prev) =>
      prev.length >= MAX
        ? prev
        : [...prev, { id: (counter.current += 1), value: "", label: "", detail: "" }],
    );

  const reorder = (fromId: number, toId: number) =>
    setRows((prev) => {
      if (fromId === toId) {
        return prev;
      }
      const from = prev.findIndex((row) => row.id === fromId);
      const to = prev.findIndex((row) => row.id === toId);
      if (from === -1 || to === -1) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved!);
      return next;
    });

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="ui-hint">
          Shown as the stat cards on the homepage. Drag to reorder; keep values brief.
        </p>
        <span className="shrink-0 text-xs tabular-nums text-muted/70">
          {rows.length}/{MAX}
        </span>
      </div>

      {rows.length > 0 ? (
        <ul className="grid gap-3">
          {rows.map((row) => (
            <li
              key={row.id}
              onDragOver={(event) => {
                if (dragId !== null) {
                  event.preventDefault();
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                if (dragId !== null) {
                  reorder(dragId, row.id);
                  setDragId(null);
                }
              }}
              className={`rounded-2xl border bg-white/[0.02] p-3 transition ${
                dragId === row.id ? "border-accent-400/50 opacity-60" : "border-line"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <button
                  type="button"
                  draggable
                  onDragStart={() => setDragId(row.id)}
                  onDragEnd={() => setDragId(null)}
                  aria-label="Drag to reorder"
                  className="mt-2 flex size-7 cursor-grab items-center justify-center rounded-lg text-muted/60 transition hover:bg-white/[0.05] hover:text-ink active:cursor-grabbing"
                >
                  <GripVertical className="size-4" aria-hidden />
                </button>

                <div className="grid min-w-0 flex-1 gap-2.5 sm:grid-cols-[8rem_1fr]">
                  <input
                    className="ui-input font-semibold"
                    value={row.value}
                    maxLength={LIMITS.value}
                    onChange={(event) => patch(row.id, "value", event.target.value)}
                    placeholder="35% → 85%"
                    aria-label="Metric value"
                  />
                  <input
                    className="ui-input"
                    value={row.label}
                    maxLength={LIMITS.label}
                    onChange={(event) => patch(row.id, "label", event.target.value)}
                    placeholder="Release Success Improvement"
                    aria-label="Metric label"
                  />
                  <input
                    className="ui-input sm:col-span-2"
                    value={row.detail}
                    maxLength={LIMITS.detail}
                    onChange={(event) => patch(row.id, "detail", event.target.value)}
                    placeholder="Optional supporting detail"
                    aria-label="Metric detail"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => remove(row.id)}
                  aria-label="Remove metric"
                  className="ui-btn-icon mt-0.5 size-9"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-line bg-white/[0.015] px-4 py-8 text-center text-sm text-muted">
          No metric cards yet.
        </p>
      )}

      <div>
        <button type="button" onClick={add} disabled={rows.length >= MAX} className="ui-btn-ghost">
          <Plus className="size-3.5" aria-hidden /> Add metric
        </button>
      </div>

      <input ref={hiddenRef} type="hidden" name={name} value={serialized} />
    </div>
  );
}
