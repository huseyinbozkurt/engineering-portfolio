import type {
  EvidenceRef,
  HomePageContent,
  InsightConfidence,
  PortfolioInsightOutput,
} from "@portfolio/validators";
import { resolveCapabilityRadarScore, type SignalRadar } from "@portfolio/validators";

/**
 * Admin review rendering of a validated insight report: every section with its
 * confidence level and expandable, resolved evidence references. Server-only;
 * evidence labels come from the run's own input snapshot so the review shows
 * exactly what the model was allowed to cite.
 */

export interface EvidenceResolver {
  (ref: string): { title: string; type: string } | null;
}

const confidenceBadge: Record<InsightConfidence, string> = {
  high: "ui-badge ui-badge-success",
  medium: "ui-badge ui-badge-warning",
  low: "ui-badge ui-badge-neutral",
};

export function ConfidenceBadge({ confidence }: { confidence: InsightConfidence }) {
  return <span className={`${confidenceBadge[confidence]} capitalize`}>{confidence} confidence</span>;
}

export function EvidenceList({
  evidence,
  resolve,
}: {
  evidence: EvidenceRef[];
  resolve: EvidenceResolver;
}) {
  if (evidence.length === 0) {
    return <p className="text-xs text-muted/70">No supporting records (absence-based observation).</p>;
  }

  return (
    <details className="group mt-1">
      <summary className="cursor-pointer select-none list-none text-xs font-medium text-accent-200 transition hover:text-accent-100 [&::-webkit-details-marker]:hidden">
        {evidence.length} supporting record{evidence.length === 1 ? "" : "s"} ▸
      </summary>
      <ul className="mt-2 grid gap-1.5">
        {evidence.map((entry) => {
          const resolved = resolve(entry.ref);
          return (
            <li
              key={entry.ref}
              className="rounded-lg border border-line bg-white/[0.02] px-3 py-2 text-xs"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-ink">{resolved?.title ?? entry.ref}</span>
                <span className="rounded-md border border-line bg-white/[0.03] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                  {resolved?.type ?? "unresolved"}
                </span>
              </div>
              {entry.note ? <p className="mt-1 leading-5 text-muted">{entry.note}</p> : null}
            </li>
          );
        })}
      </ul>
    </details>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="ui-card p-6 shadow-card">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}

const radarAxisLabels: Array<{ key: keyof PortfolioInsightOutput["signalRadar"]; label: string }> = [
  { key: "frontendEngineering", label: "Frontend Engineering" },
  { key: "technicalLeadership", label: "Technical Leadership" },
  { key: "systemDesign", label: "System Design" },
  { key: "devopsCloud", label: "DevOps & Cloud" },
  { key: "aiEngineering", label: "AI Engineering" },
  { key: "peopleManagement", label: "People Management" },
];

const levelBadge: Record<string, string> = {
  high: "ui-badge ui-badge-accent",
  medium: "ui-badge ui-badge-warning",
  low: "ui-badge ui-badge-neutral",
};

export function InsightReportView({
  output,
  resolve,
}: {
  output: PortfolioInsightOutput;
  resolve: EvidenceResolver;
}) {
  return (
    <div className="grid gap-6">
      <SectionCard title="Executive Summary">
        <div className="mb-3">
          <ConfidenceBadge confidence={output.executiveSummary.confidence} />
        </div>
        <p className="text-sm leading-7 text-ink/90">{output.executiveSummary.summary}</p>
        <EvidenceList evidence={output.executiveSummary.evidence} resolve={resolve} />
      </SectionCard>

      <SectionCard title="Strength Signals" description="Evidence-backed strengths the data supports.">
        <div className="grid gap-4 md:grid-cols-2">
          {output.strengthSignals.map((signal) => (
            <article key={signal.title} className="rounded-xl border border-line bg-white/[0.02] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-ink">{signal.title}</h3>
                <ConfidenceBadge confidence={signal.confidence} />
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{signal.summary}</p>
              <EvidenceList evidence={signal.evidence} resolve={resolve} />
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Blind Spots"
        description="Presentation gaps in the portfolio — never invented missing experience."
      >
        <div className="grid gap-4">
          {output.blindSpots.map((spot) => (
            <article key={spot.title} className="rounded-xl border border-line bg-white/[0.02] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-ink">{spot.title}</h3>
                <ConfidenceBadge confidence={spot.confidence} />
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{spot.summary}</p>
              <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                <div className="rounded-lg border border-line bg-white/[0.015] p-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted/70">Impact</dt>
                  <dd className="mt-1 leading-6 text-ink/85">{spot.impact}</dd>
                </div>
                <div className="rounded-lg border border-line bg-white/[0.015] p-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted/70">
                    Recommendation
                  </dt>
                  <dd className="mt-1 leading-6 text-ink/85">{spot.recommendation}</dd>
                </div>
              </dl>
              <EvidenceList evidence={spot.evidence} resolve={resolve} />
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Career Trajectory" description="Stages derived from record dates.">
        <ol className="grid gap-3">
          {output.careerTrajectory.stages.map((stage, index) => (
            <li key={stage.title} className="rounded-xl border border-line bg-white/[0.02] p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-accent-400/30 bg-accent-500/10 text-xs font-semibold text-accent-200">
                  {index + 1}
                </span>
                <h3 className="text-sm font-semibold text-ink">{stage.title}</h3>
                <span className="ui-chip">{stage.timeframe}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{stage.explanation}</p>
              <EvidenceList evidence={stage.evidence} resolve={resolve} />
            </li>
          ))}
        </ol>
      </SectionCard>

      <SectionCard
        title="Recruiter Simulation"
        description="How four different readers interpret the same portfolio."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {(
            [
              ["Recruiter", output.recruiterSimulation.recruiter],
              ["Hiring Manager", output.recruiterSimulation.hiringManager],
              ["Staff Engineer", output.recruiterSimulation.staffEngineer],
              ["Startup Founder", output.recruiterSimulation.startupFounder],
            ] as const
          ).map(([label, view]) => (
            <article key={label} className="rounded-xl border border-line bg-white/[0.02] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-ink">{label}</h3>
                <ConfidenceBadge confidence={view.confidence} />
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{view.summary}</p>
              <EvidenceList evidence={view.evidence} resolve={resolve} />
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Opportunity Heatmap" description="Actionable portfolio improvements.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="ui-table-head border-b border-line">
              <tr>
                <th className="py-2 pr-4 font-semibold">Opportunity</th>
                <th className="py-2 pr-4 font-semibold">Impact</th>
                <th className="py-2 pr-4 font-semibold">Effort</th>
                <th className="py-2 font-semibold">Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {output.opportunityHeatmap.map((item) => (
                <tr key={item.opportunity} className="align-top">
                  <td className="py-3 pr-4 font-medium text-ink">
                    {item.opportunity}
                    <EvidenceList evidence={item.evidence} resolve={resolve} />
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`${levelBadge[item.expectedImpact]} capitalize`}>
                      {item.expectedImpact}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`${levelBadge[item.estimatedEffort]} capitalize`}>
                      {item.estimatedEffort}
                    </span>
                  </td>
                  <td className="py-3 leading-6 text-muted">{item.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Signal Radar"
        description="Scores are capped by validation to what the cited evidence supports."
      >
        <div className="grid gap-3.5">
          {radarAxisLabels.map(({ key, label }) => {
            const axis = output.signalRadar[key];
            return (
              <div key={key}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-ink">{label}</span>
                  <span className="tabular-nums text-muted">
                    {axis.score === 0 && axis.evidence.length === 0
                      ? "Insufficient data"
                      : `${axis.score}/100`}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-accent-400"
                    style={{ width: `${Math.max(axis.score, 2)}%` }}
                  />
                </div>
                <EvidenceList evidence={axis.evidence} resolve={resolve} />
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="Grounded Data Notes"
        description="Limitations and assumptions stated by the analysis."
      >
        <ul className="grid gap-2">
          {output.groundedDataNotes.map((note) => (
            <li
              key={note}
              className="rounded-lg border border-line bg-white/[0.02] px-3.5 py-2.5 text-sm leading-6 text-muted"
            >
              {note}
            </li>
          ))}
        </ul>
      </SectionCard>

      {output.homePageContent ? (
        <SectionCard
          title="Homepage AI Insight Preview"
          description="How the generated homepage summary will appear publicly."
        >
          <HomepageInsightPreview
            content={output.homePageContent}
            signalRadar={output.signalRadar}
            resolve={resolve}
          />
        </SectionCard>
      ) : null}
    </div>
  );
}

function HomepageInsightPreview({
  content,
  signalRadar,
  resolve,
}: {
  content: HomePageContent;
  signalRadar: SignalRadar;
  resolve: EvidenceResolver;
}) {
  return (
    <div className="grid gap-6">
      <div className="rounded-xl border border-line bg-white/[0.02] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-200">
          {content.eyebrow}
        </p>
        <h3 className="mt-2 text-xl font-semibold text-ink">{content.headline}</h3>
        <p className="mt-2 text-sm leading-7 text-muted">{content.summary}</p>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted/70">
          Primary signals
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {content.primarySignals.map((signal) => (
            <article
              key={signal.title}
              className="rounded-xl border border-line bg-white/[0.02] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-ink">{signal.title}</h4>
                <ConfidenceBadge confidence={signal.confidence} />
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{signal.summary}</p>
              <EvidenceList evidence={signal.evidence} resolve={resolve} />
            </article>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted/70">
          Proof points
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {content.proofPoints.map((proof) => (
            <article
              key={`${proof.label}-${proof.value}`}
              className="rounded-xl border border-line bg-white/[0.02] p-4"
            >
              <p className="text-2xl font-semibold text-ink">{proof.value}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-accent-200">
                {proof.label}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">{proof.context}</p>
              <EvidenceList evidence={proof.evidence} resolve={resolve} />
            </article>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted/70">
          Capability snapshot
        </h3>
        <div className="grid gap-3.5">
          {content.capabilitySnapshot.map((capability) => {
            const score = resolveCapabilityRadarScore({ capability, signalRadar });

            return (
              <div key={`${capability.radarKey ?? capability.label}-${capability.label}`}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-ink">{capability.label}</span>
                  {score !== null ? (
                    <span className="tabular-nums text-muted">{score}/100</span>
                  ) : null}
                </div>
                {score !== null ? (
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-accent-400"
                      style={{ width: `${Math.max(score, 2)}%` }}
                    />
                  </div>
                ) : null}
                <p className="mt-1.5 text-xs leading-5 text-muted">{capability.summary}</p>
                <EvidenceList evidence={capability.evidence} resolve={resolve} />
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted/70">
          Call to action (read-only preview)
        </h3>
        <div className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-lg border border-line bg-white/[0.02] px-4 py-2.5 text-sm">
          <span className="font-medium text-ink">{content.cta.label}</span>
          <span aria-hidden className="text-muted">
            →
          </span>
          <span className="break-all font-mono text-xs text-accent-200">{content.cta.href}</span>
        </div>
      </div>
    </div>
  );
}
