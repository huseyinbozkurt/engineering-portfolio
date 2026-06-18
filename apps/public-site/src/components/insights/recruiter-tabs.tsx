"use client";

import { useState } from "react";

export interface RecruiterTabEvidence {
  label: string;
  href: string | null;
  note?: string | undefined;
}

export interface RecruiterTabView {
  id: string;
  label: string;
  summary: string;
  evidence: RecruiterTabEvidence[];
}

/**
 * Reader-perspective tabs: the same portfolio interpreted by four different
 * audiences. Pure presentation — all data is pre-validated server-side.
 */
export function RecruiterTabs({ views }: { views: RecruiterTabView[] }) {
  const [activeId, setActiveId] = useState(views[0]?.id ?? "");
  const active = views.find((view) => view.id === activeId) ?? views[0];

  if (!active) {
    return null;
  }

  return (
    <div className="glass-panel rounded-lg p-5 md:p-6">
      <div role="tablist" aria-label="Reader perspectives" className="flex flex-wrap gap-1.5">
        {views.map((view) => {
          const isActive = view.id === active.id;
          return (
            <button
              key={view.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActiveId(view.id)}
              className={
                isActive
                  ? "rounded-lg border border-violet-300/50 bg-violet-400/15 px-3.5 py-2 text-sm font-semibold text-ink"
                  : "rounded-lg border border-line bg-white/[0.02] px-3.5 py-2 text-sm text-muted transition hover:border-violet-300/40 hover:text-ink"
              }
            >
              {view.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="mt-5">
        <p className="text-sm leading-7 text-ink/90">{active.summary}</p>

        {active.evidence.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {active.evidence.map((entry) =>
              entry.href ? (
                <a
                  key={entry.label}
                  href={entry.href}
                  title={entry.note}
                  className="inline-flex items-center rounded-full border border-line bg-white/[0.03] px-3 py-1 text-xs text-muted transition hover:border-violet-300/50 hover:text-ink"
                >
                  {entry.label}
                </a>
              ) : (
                <span
                  key={entry.label}
                  title={entry.note}
                  className="inline-flex items-center rounded-full border border-line bg-white/[0.03] px-3 py-1 text-xs text-muted"
                >
                  {entry.label}
                </span>
              ),
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
