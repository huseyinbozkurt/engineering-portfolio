"use client";

import { useRef } from "react";

import type { FormAction } from "@/components/forms/types";

interface StatusControlProps {
  action: FormAction;
  id: string;
  status: string;
}

const statusDot: Record<string, string> = {
  published: "bg-teal-300",
  archived: "bg-amber-300",
  draft: "bg-white/40",
};

/**
 * Compact publish-state switch shown in the detail header. Submits a
 * `__fields=status` patch the moment the selection changes — a quick, reversible
 * workflow toggle (no confirm step), distinct from the gear/settings config.
 */
export function StatusControl({ action, id, status }: StatusControlProps) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action} className="inline-flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="__fields" value="status" />
      <span
        aria-hidden
        className={`size-2 rounded-full ${statusDot[status] ?? statusDot.draft}`}
      />
      <select
        name="status"
        defaultValue={status}
        aria-label="Publish status"
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-lg border border-line bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-ink outline-none transition focus:border-teal-300/60"
      >
        <option value="draft">Draft</option>
        <option value="published">Published</option>
        <option value="archived">Archived</option>
      </select>
    </form>
  );
}
