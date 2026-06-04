import type { ReactNode } from "react";

interface RecordOverviewDetail {
  label: string;
  value: string | number | null | undefined;
}

interface RecordOverviewProps {
  title: string;
  description: string;
  action: ReactNode;
  details?: RecordOverviewDetail[];
}

export function RecordOverview({ title, description, action, details = [] }: RecordOverviewProps) {
  const visibleDetails = details.filter((detail) => detail.value !== null && detail.value !== undefined);

  return (
    <section className="rounded-lg border border-line bg-white/[0.025] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">
            Selected record
          </p>
          <h2 className="mt-2 text-xl font-semibold text-ink">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            {description || "No summary has been added yet."}
          </p>
        </div>
        {action}
      </div>
      {visibleDetails.length > 0 ? (
        <dl className="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
          {visibleDetails.map((detail) => (
            <div key={detail.label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted/70">
                {detail.label}
              </dt>
              <dd className="mt-1 text-sm text-ink">{detail.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
