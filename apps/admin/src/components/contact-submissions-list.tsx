"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

export interface ContactSubmissionItem {
  id: string;
  mode: string;
  intent: string;
  name: string;
  email: string | null;
  wantsResponse: boolean;
  company: string | null;
  roleTitle: string | null;
  techStack: string | null;
  problem: string;
  desiredOutcome: string | null;
  timeline: string | null;
  message: string;
  createdAt: Date;
}

interface ContactSubmissionsListProps {
  submissions: ContactSubmissionItem[];
}

type ResponseFilter = "all" | "wants" | "none";

function formatSubmittedAt(value: Date): string {
  return value.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ContactSubmissionsList({ submissions }: ContactSubmissionsListProps) {
  const [query, setQuery] = useState("");
  const [responseFilter, setResponseFilter] = useState<ResponseFilter>("all");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return submissions.filter((submission) => {
      if (responseFilter === "wants" && !submission.wantsResponse) {
        return false;
      }
      if (responseFilter === "none" && submission.wantsResponse) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return [
        submission.name,
        submission.email,
        submission.company,
        submission.roleTitle,
        submission.intent,
        submission.problem,
        submission.desiredOutcome,
        submission.message,
      ]
        .filter(Boolean)
        .some((value) => (value as string).toLowerCase().includes(needle));
    });
  }, [submissions, query, responseFilter]);

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by name, email, message…"
            aria-label="Filter submissions"
            className="ui-input pl-10"
          />
        </div>
        <select
          aria-label="Response requested"
          value={responseFilter}
          onChange={(event) => setResponseFilter(event.target.value as ResponseFilter)}
          className="ui-select w-auto"
        >
          <option value="all">All submissions</option>
          <option value="wants">Response requested</option>
          <option value="none">No response requested</option>
        </select>
        <span className="text-xs text-muted">
          Showing {filtered.length} of {submissions.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white/[0.02] p-6 text-center text-sm text-muted">
          No submissions match the current filters.
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((submission) => (
            <article key={submission.id} className="ui-card p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-ink">{submission.name}</h2>
                    <span className="ui-badge ui-badge-neutral capitalize">
                      {formatMode(submission.mode)}
                    </span>
                    <span className="ui-badge ui-badge-warning">
                      {formatIntent(submission.intent)}
                    </span>
                    {submission.wantsResponse ? (
                      <span className="ui-badge ui-badge-success">Contact back requested</span>
                    ) : (
                      <span className="ui-badge ui-badge-neutral">No response requested</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    Received {formatSubmittedAt(submission.createdAt)}
                  </p>
                </div>
                {submission.email ? (
                  <a className="ui-btn-outline" href={`mailto:${submission.email}`}>
                    {submission.email}
                  </a>
                ) : null}
              </div>
              <dl className="mt-4 grid gap-3 rounded-xl border border-line bg-white/[0.02] p-4 text-sm md:grid-cols-2">
                <SubmissionMeta label="Company" value={submission.company} />
                <SubmissionMeta label="Role/title" value={submission.roleTitle} />
                <SubmissionMeta label="Timeline" value={submission.timeline} />
                <SubmissionMeta label="Desired outcome" value={submission.desiredOutcome} />
                <SubmissionMeta label="Tech stack" value={submission.techStack} wide />
                <SubmissionMeta label="Problem" value={submission.problem} wide />
              </dl>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted">
                {submission.message}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function SubmissionMeta({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string | null;
  wide?: boolean;
}) {
  if (!value?.trim()) {
    return null;
  }

  return (
    <div className={wide ? "md:col-span-2" : undefined}>
      <dt className="text-xs font-medium uppercase tracking-wide text-warning-200">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap leading-6 text-muted">{value}</dd>
    </div>
  );
}

function formatMode(value: string): string {
  return value === "technical" ? "Technical" : "Non-technical";
}

function formatIntent(value: string): string {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}
