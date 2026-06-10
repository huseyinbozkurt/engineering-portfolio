"use client";

import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Row {
  id: number;
  value: string;
}

interface CollectionEditorProps {
  /** Hidden field name; emitted as newline-joined, non-empty trimmed values. */
  name: string;
  label: string;
  defaultItems: string[];
  max: number;
  maxLength: number;
  placeholder?: string;
  hint?: string;
  addLabel?: string;
}

/**
 * Repeatable single-line list editor (e.g. the homepage "code focus" items).
 * Add / remove / reorder rows, with a live count against `max` and per-row length
 * cap. Serializes to one newline-separated hidden field that matches the existing
 * `bulkLines()` server contract. Dispatches a bubbling input event on change so
 * the enclosing form's dirty tracking notices.
 */
export function CollectionEditor({
  name,
  label,
  defaultItems,
  max,
  maxLength,
  placeholder,
  hint,
  addLabel = "Add item",
}: CollectionEditorProps) {
  const counter = useRef(0);
  const [rows, setRows] = useState<Row[]>(() =>
    defaultItems.map((value) => ({ id: (counter.current += 1), value })),
  );
  const hiddenRef = useRef<HTMLInputElement>(null);

  const serialized = rows
    .map((row) => row.value.trim())
    .filter(Boolean)
    .join("\n");

  useEffect(() => {
    hiddenRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }, [serialized]);

  const setValue = (id: number, value: string) =>
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, value } : row)));
  const remove = (id: number) => setRows((prev) => prev.filter((row) => row.id !== id));
  const add = () =>
    setRows((prev) => (prev.length >= max ? prev : [...prev, { id: (counter.current += 1), value: "" }]));
  const move = (index: number, direction: -1 | 1) =>
    setRows((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) {
        return prev;
      }
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });

  return (
    <div className="grid gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="ui-label">{label}</span>
        <span className="text-xs tabular-nums text-muted/70">
          {rows.length}/{max}
        </span>
      </div>
      {hint ? <p className="ui-hint">{hint}</p> : null}

      {rows.length > 0 ? (
        <ul className="grid gap-2">
          {rows.map((row, index) => (
            <li key={row.id} className="flex items-center gap-2">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Move up"
                  className="flex size-4 items-center justify-center rounded text-muted transition hover:text-ink disabled:opacity-30"
                >
                  <ChevronUp className="size-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === rows.length - 1}
                  aria-label="Move down"
                  className="flex size-4 items-center justify-center rounded text-muted transition hover:text-ink disabled:opacity-30"
                >
                  <ChevronDown className="size-3.5" aria-hidden />
                </button>
              </div>
              <input
                className="ui-input"
                value={row.value}
                maxLength={maxLength}
                placeholder={placeholder}
                onChange={(event) => setValue(row.id, event.target.value)}
              />
              <button
                type="button"
                onClick={() => remove(row.id)}
                aria-label="Remove"
                className="ui-btn-icon size-9"
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div>
        <button
          type="button"
          onClick={add}
          disabled={rows.length >= max}
          className="ui-btn-ghost"
        >
          <Plus className="size-3.5" aria-hidden /> {addLabel}
        </button>
      </div>

      <input ref={hiddenRef} type="hidden" name={name} value={serialized} />
    </div>
  );
}
