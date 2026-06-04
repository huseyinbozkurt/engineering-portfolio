import type {
  AiInsightsReport,
  InsightItem,
  ScoreInsight,
  TechnicalSkillDistributionInsight,
} from "@/lib/ai-insights/types";

interface AiInsightsReportViewProps {
  report: AiInsightsReport;
}

export function AiInsightsReportView({ report }: AiInsightsReportViewProps) {
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-white/[0.03] p-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">Generated Insight Report</h2>
          <p className="mt-1 text-sm text-muted">
            Evaluated by {report.provider.name}
            {report.provider.model ? ` using ${report.provider.model}` : ""}.
          </p>
        </div>
        <span className="rounded-full border border-line bg-white/[0.04] px-3 py-1 text-xs text-muted">
          {formatGeneratedAt(report.generatedAt)}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ScoreCard title="Overall portfolio strength" insight={report.overallPortfolioStrength} />
        <ScoreCard title="Experience coverage" insight={report.experienceCoverage} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
        <TechnicalDistribution insight={report.technicalSkillDistribution} />
        <LeadershipSignals report={report} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InsightGroup title="Missing or weak areas" items={report.missingOrWeakAreas} />
        <InsightGroup title="Recommended improvements" items={report.recommendedImprovements} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ThemeCloud title="Repeated themes" items={report.repeatedThemes} />
        <InsightGroup title="Inconsistencies" items={report.inconsistencies} emptyLabel="No inconsistencies called out." />
      </div>

      {report.groundedDataNotes.length > 0 ? (
        <section className="rounded-lg border border-line bg-white/[0.025] p-4">
          <h2 className="text-sm font-semibold text-ink">Grounding notes</h2>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted">
            {report.groundedDataNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function ScoreCard({ title, insight }: { title: string; insight: ScoreInsight }) {
  return (
    <section className="rounded-lg border border-line bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{insight.summary}</p>
        </div>
        <ScoreRing score={insight.score} />
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className={scoreBarClass(insight.score)} style={{ width: `${insight.score}%` }} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <BulletList title="Strengths" items={insight.strengths} />
        <BulletList title="Gaps" items={insight.gaps} />
      </div>
      <EvidenceList evidence={insight.evidence} />
    </section>
  );
}

function TechnicalDistribution({ insight }: { insight: TechnicalSkillDistributionInsight }) {
  const maxValue = Math.max(1, ...insight.segments.map((segment) => segment.value));

  return (
    <section className="rounded-lg border border-line bg-white/[0.03] p-5">
      <h2 className="text-base font-semibold text-ink">Technical skill distribution</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{insight.summary}</p>
      <div className="mt-5 grid gap-3">
        {insight.segments.map((segment) => (
          <div key={segment.label} className="rounded-lg border border-line bg-white/[0.025] p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-ink">{segment.label}</p>
              <span className="text-xs text-muted">{segment.value}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-teal-200"
                style={{ width: `${Math.max(8, (segment.value / maxValue) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">{segment.summary}</p>
          </div>
        ))}
      </div>
      <BulletList title="Distribution gaps" items={insight.gaps} />
    </section>
  );
}

function LeadershipSignals({ report }: { report: AiInsightsReport }) {
  return (
    <section className="rounded-lg border border-line bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Leadership / ownership signals</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {report.leadershipOwnershipSignals.summary}
          </p>
        </div>
        <ScoreRing score={report.leadershipOwnershipSignals.score} />
      </div>
      <div className="mt-5 grid gap-3">
        {report.leadershipOwnershipSignals.signals.map((item) => (
          <InsightBlock key={`${item.title}-${item.detail}`} item={item} />
        ))}
      </div>
    </section>
  );
}

function InsightGroup({
  title,
  items,
  emptyLabel = "No items returned.",
}: {
  title: string;
  items: InsightItem[];
  emptyLabel?: string;
}) {
  return (
    <section className="rounded-lg border border-line bg-white/[0.03] p-5">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{emptyLabel}</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {items.map((item) => (
            <InsightBlock key={`${item.title}-${item.detail}`} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

function InsightBlock({ item }: { item: InsightItem }) {
  return (
    <article className="rounded-lg border border-line bg-white/[0.025] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">{item.title || "Insight"}</h3>
        <span className={priorityClass(item.priority)}>{item.priority}</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">{item.detail}</p>
      <EvidenceList evidence={item.evidence} />
    </article>
  );
}

function ThemeCloud({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg border border-line bg-white/[0.03] p-5">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No repeated themes returned.</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="rounded-full border border-teal-300/25 bg-teal-300/10 px-3 py-1 text-xs text-teal-100"
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function BulletList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-200">{title}</h3>
      <ul className="mt-2 grid gap-1.5 text-sm leading-6 text-muted">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function EvidenceList({ evidence }: { evidence: string[] }) {
  if (evidence.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {evidence.map((item) => (
        <span key={item} className="rounded-md border border-line bg-white/[0.04] px-2 py-1 text-xs text-muted">
          {item}
        </span>
      ))}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  return (
    <div className="grid size-16 shrink-0 place-items-center rounded-full border border-line bg-white/[0.04]">
      <span className="text-lg font-semibold text-ink">{score}</span>
    </div>
  );
}

function scoreBarClass(score: number): string {
  const color = score >= 75 ? "bg-teal-200" : score >= 45 ? "bg-amber-200" : "bg-rose-300";

  return `h-full rounded-full ${color}`;
}

function priorityClass(priority: InsightItem["priority"]): string {
  switch (priority) {
    case "high":
      return "rounded-full border border-rose-300/30 bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-100";
    case "low":
      return "rounded-full border border-line bg-white/[0.04] px-2 py-0.5 text-xs font-medium text-muted";
    default:
      return "rounded-full border border-amber-200/30 bg-amber-200/10 px-2 py-0.5 text-xs font-medium text-amber-100";
  }
}

function formatGeneratedAt(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
