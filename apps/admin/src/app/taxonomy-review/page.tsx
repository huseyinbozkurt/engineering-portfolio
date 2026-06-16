import Link from "next/link";

import type {
  TaxonomySuggestionStatus,
  TaxonomyTargetGroup,
} from "@portfolio/validators";
import { getAiModelDisplayName } from "@portfolio/validators";
import {
  getActiveTaxonomyReviewRun,
  getLatestTaxonomyReviewRunWithSuggestions,
  getTaxonomyReviewRuns,
  type TaxonomyReviewRunRecord,
  type TaxonomyReviewSuggestionRecord,
} from "@portfolio/db/taxonomy-review";

import { EmptyPanel } from "@/components/empty-panel";
import { LlmStatusPanel } from "@/components/llm-status-panel";
import { PageTitle } from "@/components/page-title";
import { TasksAutoRefresh } from "@/components/tasks-auto-refresh";
import { TestLlmButton } from "@/components/test-llm-button";
import { GenerateTaxonomyReviewButton } from "@/components/taxonomy-review/generate-taxonomy-review-button";
import { formatDate } from "@/lib/format";
import { getLlmConnectionStatuses } from "@/lib/llm-config";
import {
  bulkSetTaxonomySuggestionStatusAction,
  setTaxonomySuggestionStatusAction,
} from "./actions";

export const dynamic = "force-dynamic";

type GroupFilter = "all" | TaxonomyTargetGroup;
type StatusFilter = "all" | TaxonomySuggestionStatus;

const groups: Array<{ value: TaxonomyTargetGroup; label: string }> = [
  { value: "skills", label: "Skills" },
  { value: "tags", label: "Tags" },
  { value: "lenses", label: "Lenses" },
  { value: "principles", label: "Principles" },
  { value: "decisionPatterns", label: "Decision Patterns" },
];

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

interface TaxonomyReviewPageProps {
  searchParams: Promise<{ group?: string; status?: string }>;
}

export default async function TaxonomyReviewPage({
  searchParams,
}: TaxonomyReviewPageProps) {
  const query = await searchParams;
  const selectedGroup = parseGroupFilter(query.group);
  const selectedStatus = parseStatusFilter(query.status);

  const [run, runs, activeRun, llmStatuses] = await Promise.all([
    getLatestTaxonomyReviewRunWithSuggestions(),
    getTaxonomyReviewRuns(8),
    getActiveTaxonomyReviewRun(),
    getLlmConnectionStatuses(),
  ]);

  const onlineCount = llmStatuses.filter((status) => status.status === "online").length;
  const disabledReason = activeRun
    ? "A taxonomy review is already in progress."
    : onlineCount === 0
      ? "No LLM connection is online. Configure a provider before generating."
      : null;

  const suggestions = run?.suggestions ?? [];
  const counts = summarizeSuggestions(suggestions);
  const filtered = suggestions.filter(
    (suggestion) =>
      (selectedGroup === "all" || suggestion.targetGroup === selectedGroup) &&
      (selectedStatus === "all" || suggestion.status === selectedStatus),
  );

  return (
    <main className="px-5 py-8 lg:px-8">
      <TasksAutoRefresh enabled={Boolean(activeRun)} />
      <PageTitle
        title="Taxonomy Review"
        description="LLM-generated suggestions for supporting portfolio taxonomy. Canonical experiences, projects, and case studies are analysis-only and are never modified by this workflow."
        actions={
          <div className="flex items-center gap-3">
            <TestLlmButton disabled={!Boolean(onlineCount > 0)} />
            <GenerateTaxonomyReviewButton disabledReason={disabledReason} />
          </div>
        }
      />

      {!run ? (
        <EmptyPanel
          title="No taxonomy reviews yet"
          description="Generate a review to analyze the primary portfolio records and stage supporting-data suggestions."
        />
      ) : (
        <div className="grid gap-6">
          <RunSummary run={run} counts={counts} />

          {run.status === "failed" ? (
            <section className="ui-card border-danger-800/50 bg-danger-950/20 p-5 shadow-card">
              <h2 className="ui-section-title">Generation failed</h2>
              <p className="mt-2 text-sm leading-6 text-danger-100">
                {run.errorMessage ?? "The review failed before suggestions were saved."}
              </p>
            </section>
          ) : null}

          <section className="ui-card p-5 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="ui-section-title">Review controls</h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Approving a suggestion records it as accepted for review purposes only. It does
                  not automatically modify portfolio data. Bulk actions only change pending
                  suggestions, so individual decisions stay intact.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <BulkStatusForm runId={run.id} status="approved" label="Approve all pending" />
                <BulkStatusForm runId={run.id} status="rejected" label="Reject all pending" />
              </div>
            </div>
          </section>

          <section>
            <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <GroupTabs selectedGroup={selectedGroup} selectedStatus={selectedStatus} counts={counts} />
              <StatusFilterForm selectedGroup={selectedGroup} selectedStatus={selectedStatus} />
            </div>

            {selectedGroup !== "all" ? (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="ui-section-title">{groupLabel(selectedGroup)}</h2>
                <div className="flex flex-wrap gap-2">
                  <BulkStatusForm
                    runId={run.id}
                    targetGroup={selectedGroup}
                    status="approved"
                    label="Approve group pending"
                  />
                  <BulkStatusForm
                    runId={run.id}
                    targetGroup={selectedGroup}
                    status="rejected"
                    label="Reject group pending"
                  />
                </div>
              </div>
            ) : null}

            {filtered.length === 0 ? (
              <EmptyPanel
                title="No suggestions match this filter"
                description="Try a different group or status filter, or generate a new review."
              />
            ) : selectedGroup === "all" ? (
              <div className="grid gap-6">
                {groups.map((group) => {
                  const groupSuggestions = filtered.filter(
                    (suggestion) => suggestion.targetGroup === group.value,
                  );
                  if (groupSuggestions.length === 0) {
                    return null;
                  }
                  return (
                    <section key={group.value}>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <h2 className="ui-section-title">{group.label}</h2>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="ui-chip tabular-nums">
                            {groupSuggestions.length} shown
                          </span>
                          <BulkStatusForm
                            runId={run.id}
                            targetGroup={group.value}
                            status="approved"
                            label="Approve group pending"
                          />
                          <BulkStatusForm
                            runId={run.id}
                            targetGroup={group.value}
                            status="rejected"
                            label="Reject group pending"
                          />
                        </div>
                      </div>
                      <SuggestionGrid suggestions={groupSuggestions} />
                    </section>
                  );
                })}
              </div>
            ) : (
              <SuggestionGrid suggestions={filtered} />
            )}
          </section>
        </div>
      )}

      {runs.length > 0 ? (
        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="ui-section-title">Recent runs</h2>
            <span className="ui-chip tabular-nums">{runs.length} shown</span>
          </div>
          <div className="ui-card overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[46rem] text-left text-sm">
                <thead className="ui-table-head border-b border-line bg-white/[0.015]">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 font-semibold">Model</th>
                    <th className="px-4 py-2.5 font-semibold">Generated</th>
                    <th className="px-4 py-2.5 font-semibold">Reviewed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {runs.map((item) => (
                    <tr key={item.id} className="ui-row">
                      <td className="px-4 py-3">
                        <RunStatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3 text-muted">
                        <span className="text-ink">
                          {getAiModelDisplayName({ provider: item.provider, model: item.model })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {formatDate(item.generatedAt ?? item.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-muted">{formatDate(item.reviewedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      <LlmStatusPanel statuses={llmStatuses} />
    </main>
  );
}

function RunSummary({
  run,
  counts,
}: {
  run: TaxonomyReviewRunRecord;
  counts: SuggestionCounts;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard label="Total suggestions" value={counts.total} />
      <SummaryCard label="Pending" value={counts.pending} />
      <SummaryCard label="Approved" value={counts.approved} />
      <SummaryCard label="Rejected" value={counts.rejected} />
      <div className="ui-card p-5 shadow-card md:col-span-2 xl:col-span-4">
        <div className="flex flex-wrap items-center gap-2">
          <RunStatusBadge status={run.status} />
          <span className="ui-chip">
            {getAiModelDisplayName({ provider: run.provider, model: run.model })}
          </span>
          <span className="ui-chip">generated {formatDate(run.generatedAt ?? run.createdAt)}</span>
          {run.reviewedAt ? <span className="ui-chip">reviewed {formatDate(run.reviewedAt)}</span> : null}
        </div>
        {run.validationNotes?.length ? (
          <ul className="mt-4 grid gap-2 text-sm leading-6 text-muted">
            {run.validationNotes.slice(0, 4).map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="ui-card p-5 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-ink">{value}</p>
    </article>
  );
}

function GroupTabs({
  selectedGroup,
  selectedStatus,
  counts,
}: {
  selectedGroup: GroupFilter;
  selectedStatus: StatusFilter;
  counts: SuggestionCounts;
}) {
  const tabs: Array<{ value: GroupFilter; label: string; count: number }> = [
    { value: "all", label: "All suggestions", count: counts.total },
    ...groups.map((group) => ({
      value: group.value,
      label: group.label,
      count: counts.byGroup[group.value].total,
    })),
  ];

  return (
    <nav className="flex max-w-full gap-2 overflow-x-auto pb-1" aria-label="Suggestion groups">
      {tabs.map((tab) => {
        const active = tab.value === selectedGroup;
        const href = taxonomyReviewHref(tab.value, selectedStatus);
        return (
          <Link
            key={tab.value}
            href={href}
            className={
              active
                ? "ui-btn-primary shrink-0"
                : "ui-btn-secondary shrink-0"
            }
          >
            {tab.label}
            <span className="ml-1 tabular-nums">{tab.count}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function StatusFilterForm({
  selectedGroup,
  selectedStatus,
}: {
  selectedGroup: GroupFilter;
  selectedStatus: StatusFilter;
}) {
  return (
    <form method="get" className="flex items-end gap-2">
      <input type="hidden" name="group" value={selectedGroup} />
      <label className="grid gap-1 text-sm text-muted">
        Status
        <select
          name="status"
          defaultValue={selectedStatus}
          className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="ui-btn-secondary">
        Filter
      </button>
    </form>
  );
}

function SuggestionGrid({
  suggestions,
}: {
  suggestions: TaxonomyReviewSuggestionRecord[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {suggestions.map((suggestion) => (
        <SuggestionCard key={suggestion.id} suggestion={suggestion} />
      ))}
    </div>
  );
}

function SuggestionCard({
  suggestion,
}: {
  suggestion: TaxonomyReviewSuggestionRecord;
}) {
  const evidenceRefs = Array.isArray(suggestion.evidenceRefs)
    ? suggestion.evidenceRefs
    : [];
  const affectedRecords = Array.isArray(suggestion.affectedRecords)
    ? suggestion.affectedRecords
    : [];

  return (
    <article className="ui-card p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <span className="ui-badge ui-badge-accent capitalize">{suggestion.action}</span>
          <span className="ui-badge ui-badge-neutral">{groupLabel(suggestion.targetGroup)}</span>
          <ConfidenceBadge confidence={suggestion.confidence} />
          <SuggestionStatusBadge status={suggestion.status} />
        </div>
        <div className="flex gap-2">
          <SuggestionStatusForm
            suggestionId={suggestion.id}
            status="approved"
            label="Approve"
            disabled={suggestion.status === "approved"}
          />
          <SuggestionStatusForm
            suggestionId={suggestion.id}
            status="rejected"
            label="Reject"
            disabled={suggestion.status === "rejected"}
          />
        </div>
      </div>

      <dl className="mt-4 grid gap-3 text-sm">
        {suggestion.currentValue ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Current value
            </dt>
            <dd className="mt-1 text-ink">{suggestion.currentValue}</dd>
          </div>
        ) : null}
        {suggestion.proposedValue ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Proposed value
            </dt>
            <dd className="mt-1 text-ink">{suggestion.proposedValue}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Reason</dt>
          <dd className="mt-1 leading-6 text-muted">{suggestion.reason}</dd>
        </div>
      </dl>

      <EvidenceList title="Evidence refs" refs={evidenceRefs} />
      {affectedRecords.length > 0 ? (
        <EvidenceList title="Affected records" refs={affectedRecords} />
      ) : null}
    </article>
  );
}

function EvidenceList({
  title,
  refs,
}: {
  title: string;
  refs: TaxonomyReviewSuggestionRecord["evidenceRefs"];
}) {
  if (!Array.isArray(refs) || refs.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {refs.map((ref) => (
          <li key={`${ref.type}:${ref.id}:${ref.note ?? ""}`} className="ui-chip max-w-full">
            <span className="truncate">
              {ref.title ?? ref.id}
              {ref.note ? ` - ${ref.note}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BulkStatusForm({
  runId,
  targetGroup,
  status,
  label,
}: {
  runId: string;
  targetGroup?: TaxonomyTargetGroup;
  status: TaxonomySuggestionStatus;
  label: string;
}) {
  return (
    <form action={bulkSetTaxonomySuggestionStatusAction}>
      <input type="hidden" name="runId" value={runId} />
      <input type="hidden" name="status" value={status} />
      {targetGroup ? <input type="hidden" name="targetGroup" value={targetGroup} /> : null}
      <button type="submit" className={status === "rejected" ? "ui-btn-secondary" : "ui-btn-outline"}>
        {label}
      </button>
    </form>
  );
}

function SuggestionStatusForm({
  suggestionId,
  status,
  label,
  disabled,
}: {
  suggestionId: string;
  status: TaxonomySuggestionStatus;
  label: string;
  disabled: boolean;
}) {
  return (
    <form action={setTaxonomySuggestionStatusAction}>
      <input type="hidden" name="suggestionId" value={suggestionId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        disabled={disabled}
        className={
          status === "approved"
            ? "ui-btn-outline disabled:opacity-50"
            : "ui-btn-secondary disabled:opacity-50"
        }
      >
        {label}
      </button>
    </form>
  );
}

function RunStatusBadge({ status }: { status: string }) {
  const label = status === "applied" ? "succeeded" : status;
  const tone =
    label === "succeeded"
      ? "ui-badge-success"
      : label === "failed"
        ? "ui-badge-danger"
        : label === "running"
          ? "ui-badge-accent"
          : "ui-badge-neutral";
  return <span className={`ui-badge capitalize ${tone}`}>{label}</span>;
}

function SuggestionStatusBadge({ status }: { status: TaxonomySuggestionStatus }) {
  const tone =
    status === "approved"
      ? "ui-badge-success"
      : status === "rejected"
        ? "ui-badge-danger"
        : "ui-badge-warning";
  return <span className={`ui-badge capitalize ${tone}`}>{status}</span>;
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const tone =
    confidence === "high"
      ? "ui-badge-success"
      : confidence === "medium"
        ? "ui-badge-warning"
        : "ui-badge-neutral";
  return <span className={`ui-badge capitalize ${tone}`}>{confidence}</span>;
}

interface SuggestionCounts {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  byGroup: Record<TaxonomyTargetGroup, { total: number; pending: number; approved: number; rejected: number }>;
}

function summarizeSuggestions(
  suggestions: TaxonomyReviewSuggestionRecord[],
): SuggestionCounts {
  const empty = () => ({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const counts: SuggestionCounts = {
    ...empty(),
    byGroup: {
      skills: empty(),
      tags: empty(),
      lenses: empty(),
      principles: empty(),
      decisionPatterns: empty(),
    },
  };

  for (const suggestion of suggestions) {
    counts.total += 1;
    counts[suggestion.status] += 1;
    const group = counts.byGroup[suggestion.targetGroup];
    group.total += 1;
    group[suggestion.status] += 1;
  }

  return counts;
}

function parseGroupFilter(value: string | undefined): GroupFilter {
  if (value === "all" || groups.some((group) => group.value === value)) {
    return value as GroupFilter;
  }
  return "all";
}

function parseStatusFilter(value: string | undefined): StatusFilter {
  if (value === "all" || value === "pending" || value === "approved" || value === "rejected") {
    return value;
  }
  return "all";
}

function taxonomyReviewHref(group: GroupFilter, status: StatusFilter): string {
  const params = new URLSearchParams();
  params.set("group", group);
  if (status !== "all") {
    params.set("status", status);
  }
  return `/taxonomy-review?${params.toString()}`;
}

function groupLabel(group: TaxonomyTargetGroup): string {
  return groups.find((item) => item.value === group)?.label ?? group;
}
