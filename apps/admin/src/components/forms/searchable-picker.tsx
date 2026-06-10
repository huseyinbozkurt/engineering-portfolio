"use client";

import { Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export interface PickerOption {
  id: string;
  label: string;
  hint?: string | null | undefined;
}

interface SearchablePickerProps {
  /** Hidden field name; one hidden input is emitted per selected id. */
  name: string;
  label: string;
  options: PickerOption[];
  defaultSelectedIds?: readonly string[] | undefined;
  emptyLabel?: string;
  placeholder?: string;
  hint?: string;
}

/**
 * Searchable multi-select with selected items shown as removable chips and a
 * filtered, previewed option list. Selections are emitted as hidden inputs in
 * source order (matching the previous checkbox group's `ids()` contract), so the
 * server action is unchanged. Dispatches a bubbling input event on change for the
 * form's dirty tracking.
 */
export function SearchablePicker({
  name,
  label,
  options,
  defaultSelectedIds,
  emptyLabel = "Nothing available to select yet.",
  placeholder = "Search to add…",
  hint,
}: SearchablePickerProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(defaultSelectedIds ?? []));
  const [query, setQuery] = useState("");
  const syncRef = useRef<HTMLDivElement>(null);

  const selectedOptions = options.filter((option) => selected.has(option.id));
  const selectionKey = selectedOptions.map((option) => option.id).join(",");

  useEffect(() => {
    syncRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }, [selectionKey]);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return options.filter(
      (option) =>
        !selected.has(option.id) &&
        (!needle || `${option.label} ${option.hint ?? ""}`.toLowerCase().includes(needle)),
    );
  }, [options, query, selected]);

  const add = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  const remove = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  return (
    <fieldset className="ui-fieldset">
      <legend className="ui-legend">{label}</legend>
      {hint ? <p className="ui-hint">{hint}</p> : null}

      {options.length === 0 ? (
        <p className="text-sm text-muted">{emptyLabel}</p>
      ) : (
        <>
          {selectedOptions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {selectedOptions.map((option) => (
                <span
                  key={option.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-accent-400/30 bg-accent-500/10 py-1 pl-3 pr-1.5 text-xs text-accent-100"
                >
                  {option.label}
                  <button
                    type="button"
                    onClick={() => remove(option.id)}
                    aria-label={`Remove ${option.label}`}
                    className="flex size-4 items-center justify-center rounded-full text-accent-200/70 transition hover:bg-white/10 hover:text-ink"
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="ui-hint">None selected.</p>
          )}

          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              aria-label={`Search ${label}`}
              className="ui-input pl-10"
            />
          </div>

          {query.trim() ? (
            <div className="max-h-56 overflow-y-auto rounded-xl border border-line bg-white/[0.01]">
              {matches.length === 0 ? (
                <p className="px-3 py-3 text-sm text-muted">No matches.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {matches.slice(0, 50).map((option) => (
                    <li key={option.id}>
                      <button
                        type="button"
                        onClick={() => add(option.id)}
                        className="group flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-muted transition hover:bg-white/[0.04] hover:text-ink"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <Plus
                            className="size-3.5 shrink-0 text-muted/50 transition group-hover:text-accent-200"
                            aria-hidden
                          />
                          <span className="min-w-0 truncate">{option.label}</span>
                        </span>
                        {option.hint ? (
                          <span className="shrink-0 rounded-md border border-line bg-white/[0.03] px-1.5 py-0.5 text-[11px] text-muted">
                            {option.hint}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </>
      )}

      <div ref={syncRef} className="hidden">
        {selectedOptions.map((option) => (
          <input key={option.id} type="hidden" name={name} value={option.id} />
        ))}
      </div>
    </fieldset>
  );
}
