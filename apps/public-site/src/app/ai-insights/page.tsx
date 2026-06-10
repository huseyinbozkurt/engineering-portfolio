import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getLatestPublishedAiInsightRun } from "@portfolio/db/ai-insight-runs";
import {
  portfolioInsightInputSchema,
  portfolioInsightOutputSchema,
  type EvidenceRef,
  type InsightConfidence,
  type PortfolioInsightOutput,
} from "@portfolio/validators";

import { ComingSoon } from "@/components/coming-soon";
import { EmptyState } from "@/components/empty-state";
import { InsightRadar, type RadarAxis } from "@/components/insights/insight-radar";
import { RecruiterTabs, type RecruiterTabView } from "@/components/insights/recruiter-tabs";
import { SectionHeader } from "@/components/portfolio-ui";
import { getPublicSiteAvailability } from "@/lib/site-availability";

export const metadata: Metadata = {
  title: "AI Insights",
  description:
    "Evidence-driven analysis of this portfolio — generated from published records only, validated against the data, and reviewed before publishing.",
  alternates: {
    canonical: "/ai-insights",
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const INTEGRITY_LINE =
  "Insights are generated exclusively from portfolio data and do not introduce fictional achievements or experiences.";

interface ResolvedEvidence {
  label: string;
  type: string;
  href: string | null;
  note?: string | undefined;
}

type EvidenceResolver = (entry: EvidenceRef) => ResolvedEvidence;

export default async function AiInsightsPage() {
  const { shouldShowComingSoon } = await getPublicSiteAvailability();

  if (shouldShowComingSoon) {
    return <ComingSoon />;
  }

  const run = await getLatestPublishedAiInsightRun();
  const parsedOutput = run ? portfolioInsightOutputSchema.safeParse(run.outputJson) : null;

  if (!run || !parsedOutput?.success) {
    return (
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <EmptyState
          title="The insight report is being prepared."
          description="An evidence-driven analysis of this portfolio will appear here once a generation run has been reviewed and published."
        />
      </section>
    );
  }

  const output = parsedOutput.data;
  const resolve = buildResolver(run.inputSnapshot);
  const recordsAnalyzed = countRecords(run.inputSnapshot);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
      {/* Hero */}
      <section className="grid gap-6">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
            AI Insights · Portfolio Intelligence
          </p>
          <h1 className="max-w-3xl text-3xl font-semibold text-ink md:text-4xl">
            An evidence-driven read of this portfolio
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">{INTEGRITY_LINE}</p>
        </div>

        <div className="glass-panel rounded-lg p-6 shadow-glow md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
              Executive summary
            </span>
            <ConfidencePill confidence={output.executiveSummary.confidence} />
          </div>
          <p className="mt-4 text-base leading-8 text-ink/95 md:text-lg md:leading-9">
            {output.executiveSummary.summary}
          </p>
          <EvidenceChips evidence={output.executiveSummary.evidence} resolve={resolve} />

          <dl className="mt-7 grid gap-4 border-t border-line pt-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <HeroMeta label="Records analyzed" value={recordsAnalyzed ? String(recordsAnalyzed) : "—"} />
            <HeroMeta
              label="Generated"
              value={run.completedAt ? formatDate(run.completedAt) : formatDate(run.createdAt)}
            />
            <HeroMeta
              label="Model"
              value={[run.provider, run.model].filter(Boolean).join(" · ") || "—"}
            />
            <HeroMeta label="Prompt version" value={run.promptVersion} />
          </dl>
        </div>
      </section>

      {/* Strength signals */}
      <section className="mt-16">
        <SectionHeader
          eyebrow="Strength Signals"
          title="What the evidence supports"
          description="Each signal is backed by specific portfolio records — expandable below every card."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {output.strengthSignals.map((signal) => (
            <article key={signal.title} className="glass-panel h-full rounded-lg p-5 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-ink">{signal.title}</h3>
                <ConfidencePill confidence={signal.confidence} />
              </div>
              <p className="mt-3 text-sm leading-7 text-muted">{signal.summary}</p>
              <EvidenceChips evidence={signal.evidence} resolve={resolve} />
            </article>
          ))}
        </div>
      </section>

      {/* Blind spots as growth opportunities */}
      <section className="mt-16">
        <SectionHeader
          eyebrow="Growth Opportunities"
          title="Where the portfolio can speak more clearly"
          description="Presentation gaps surfaced by the analysis — opportunities to make existing work more visible, never invented missing experience."
        />
        <div className="grid gap-4">
          {output.blindSpots.map((spot) => (
            <article key={spot.title} className="glass-panel rounded-lg p-5 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-ink">{spot.title}</h3>
                <ConfidencePill confidence={spot.confidence} />
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{spot.summary}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-line bg-white/[0.02] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">
                    Why it matters
                  </p>
                  <p className="mt-2 text-sm leading-6 text-ink/85">{spot.impact}</p>
                </div>
                <div className="rounded-lg border border-line bg-white/[0.02] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
                    Suggested next step
                  </p>
                  <p className="mt-2 text-sm leading-6 text-ink/85">{spot.recommendation}</p>
                </div>
              </div>
              <EvidenceChips evidence={spot.evidence} resolve={resolve} />
            </article>
          ))}
        </div>
      </section>

      {/* Career trajectory */}
      <section className="mt-16">
        <SectionHeader
          eyebrow="Career Trajectory"
          title="How the work evolved"
          description="Stages derived from the dates on published records. Expand a stage to see its supporting evidence."
        />
        <ol className="relative grid gap-0 border-l border-violet-300/25 pl-6 md:pl-8">
          {output.careerTrajectory.stages.map((stage, index) => (
            <li key={stage.title} className="relative pb-8 last:pb-0">
              <span
                aria-hidden
                className="absolute -left-6 top-1 flex size-5 items-center justify-center rounded-full border border-violet-300/50 bg-surface md:-left-8"
              >
                <span className="size-2 rounded-full bg-violet-300" />
              </span>
              <div className="glass-panel rounded-lg p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
                    Stage {index + 1}
                  </span>
                  <span className="rounded-full border border-line bg-white/[0.03] px-2.5 py-0.5 text-xs text-muted">
                    {stage.timeframe}
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-ink">{stage.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted">{stage.explanation}</p>
                <EvidenceChips evidence={stage.evidence} resolve={resolve} />
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Recruiter simulation */}
      <section className="mt-16">
        <SectionHeader
          eyebrow="Reader Perspectives"
          title="The same portfolio, four different readers"
          description="How a recruiter, a hiring manager, a staff engineer, and a startup founder each interpret the same evidence."
        />
        <RecruiterTabs views={buildRecruiterViews(output, resolve)} />
      </section>

      {/* Opportunity heatmap */}
      <section className="mt-16">
        <SectionHeader
          eyebrow="Opportunity Heatmap"
          title="Highest-leverage improvements"
          description="Concrete portfolio improvements ranked by expected impact and estimated effort."
        />
        <div className="glass-panel overflow-hidden rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  <th className="px-5 py-3.5">Opportunity</th>
                  <th className="px-5 py-3.5">Impact</th>
                  <th className="px-5 py-3.5">Effort</th>
                  <th className="px-5 py-3.5">Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {output.opportunityHeatmap.map((item) => (
                  <tr key={item.opportunity} className="align-top">
                    <td className="px-5 py-4 font-medium text-ink">{item.opportunity}</td>
                    <td className="px-5 py-4">
                      <LevelPill level={item.expectedImpact} kind="impact" />
                    </td>
                    <td className="px-5 py-4">
                      <LevelPill level={item.estimatedEffort} kind="effort" />
                    </td>
                    <td className="px-5 py-4 leading-6 text-muted">{item.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Signal radar */}
      <section className="mt-16">
        <SectionHeader
          eyebrow="Signal Radar"
          title="Where the signals concentrate"
          description="Scores are capped by validation to what the cited evidence supports — axes without enough records are shown as insufficient rather than estimated."
        />
        <div className="glass-panel rounded-lg p-6 md:p-8">
          <InsightRadar axes={buildRadarAxes(output)} />
        </div>
      </section>

      {/* Grounded data notes */}
      <section className="mt-16 pb-4">
        <SectionHeader
          eyebrow="Grounded Data Notes"
          title="Limits of this analysis"
          description="Stated assumptions and limitations — included deliberately, because an honest readout beats an inflated one."
        />
        <ul className="grid gap-2.5">
          {output.groundedDataNotes.map((note) => (
            <li
              key={note}
              className="glass-panel rounded-lg px-5 py-4 text-sm leading-7 text-muted"
            >
              {note}
            </li>
          ))}
        </ul>
        <p className="mt-8 border-t border-line pt-5 text-xs leading-6 text-muted">
          {INTEGRITY_LINE} Generated{" "}
          {run.completedAt ? formatDate(run.completedAt) : formatDate(run.createdAt)} · prompt{" "}
          {run.promptVersion}
          {run.provider ? ` · ${run.provider}` : ""}
          {run.model ? ` (${run.model})` : ""}. Reviewed and published from the portfolio admin.
        </p>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Presentation helpers
// ---------------------------------------------------------------------------

function HeroMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted/70">{label}</dt>
      <dd className="mt-1 font-medium text-ink">{value}</dd>
    </div>
  );
}

const confidencePillClasses: Record<InsightConfidence, string> = {
  high: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200",
  medium: "border-amber-300/30 bg-amber-300/10 text-amber-200",
  low: "border-line bg-white/[0.04] text-muted",
};

function ConfidencePill({ confidence }: { confidence: InsightConfidence }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${confidencePillClasses[confidence]}`}
    >
      {confidence} confidence
    </span>
  );
}

function LevelPill({ level, kind }: { level: "low" | "medium" | "high"; kind: "impact" | "effort" }) {
  // High impact is good (emerald); high effort is costly (amber).
  const tone =
    kind === "impact"
      ? level === "high"
        ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200"
        : level === "medium"
          ? "border-sky-300/30 bg-sky-300/10 text-sky-200"
          : "border-line bg-white/[0.04] text-muted"
      : level === "high"
        ? "border-amber-300/30 bg-amber-300/10 text-amber-200"
        : level === "medium"
          ? "border-sky-300/30 bg-sky-300/10 text-sky-200"
          : "border-emerald-300/30 bg-emerald-300/10 text-emerald-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${tone}`}
    >
      {level}
    </span>
  );
}

function EvidenceChips({
  evidence,
  resolve,
}: {
  evidence: EvidenceRef[];
  resolve: EvidenceResolver;
}): ReactNode {
  if (evidence.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted/60">
        Evidence
      </span>
      {evidence.map((entry) => {
        const resolved = resolve(entry);
        const title = entry.note ?? resolved.type;
        return resolved.href ? (
          <a
            key={entry.ref}
            href={resolved.href}
            title={title}
            className="inline-flex items-center rounded-full border border-line bg-white/[0.03] px-3 py-1 text-xs text-muted transition hover:border-violet-300/50 hover:text-ink"
          >
            {resolved.label}
          </a>
        ) : (
          <span
            key={entry.ref}
            title={title}
            className="inline-flex items-center rounded-full border border-line bg-white/[0.03] px-3 py-1 text-xs text-muted"
          >
            {resolved.label}
          </span>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

const publicRouteByType: Record<string, (part: string) => string> = {
  "case-study": (part) => `/case-studies/${part}`,
  experience: (part) => `/experience/${part}`,
  project: (part) => `/projects/${part}`,
  lens: (part) => `/lenses/${part}`,
};

function buildResolver(inputSnapshot: unknown): EvidenceResolver {
  const parsed = portfolioInsightInputSchema.safeParse(inputSnapshot);
  const labels = new Map<string, { title: string; type: string }>();

  if (parsed.success) {
    for (const records of Object.values(parsed.data.records)) {
      for (const record of records) {
        labels.set(record.ref, { title: record.title, type: record.type });
      }
    }
  }

  return (entry) => {
    const known = labels.get(entry.ref);
    const [type = "", part = ""] = splitRef(entry.ref);
    const route = publicRouteByType[type];

    return {
      label: known?.title ?? part ?? entry.ref,
      type: known?.type ?? type,
      href: route && part ? route(part) : null,
      note: entry.note,
    };
  };
}

function splitRef(ref: string): [string, string] {
  const index = ref.indexOf(":");
  if (index === -1) {
    return [ref, ""];
  }
  return [ref.slice(0, index), ref.slice(index + 1)];
}

function countRecords(inputSnapshot: unknown): number | null {
  const parsed = portfolioInsightInputSchema.safeParse(inputSnapshot);
  if (!parsed.success) {
    return null;
  }
  return Object.values(parsed.data.meta.totals).reduce((sum, value) => sum + value, 0);
}

function buildRecruiterViews(
  output: PortfolioInsightOutput,
  resolve: EvidenceResolver,
): RecruiterTabView[] {
  const toView = (
    id: string,
    label: string,
    view: PortfolioInsightOutput["recruiterSimulation"]["recruiter"],
  ): RecruiterTabView => ({
    id,
    label,
    summary: view.summary,
    confidence: view.confidence,
    evidence: view.evidence.map((entry) => {
      const resolved = resolve(entry);
      return { label: resolved.label, href: resolved.href, note: entry.note };
    }),
  });

  return [
    toView("recruiter", "Recruiter", output.recruiterSimulation.recruiter),
    toView("hiring-manager", "Hiring Manager", output.recruiterSimulation.hiringManager),
    toView("staff-engineer", "Staff Engineer", output.recruiterSimulation.staffEngineer),
    toView("startup-founder", "Startup Founder", output.recruiterSimulation.startupFounder),
  ];
}

function buildRadarAxes(output: PortfolioInsightOutput): RadarAxis[] {
  const axes: Array<{ key: keyof PortfolioInsightOutput["signalRadar"]; label: string }> = [
    { key: "frontendEngineering", label: "Frontend" },
    { key: "technicalLeadership", label: "Leadership" },
    { key: "systemDesign", label: "System Design" },
    { key: "devopsCloud", label: "DevOps & Cloud" },
    { key: "aiEngineering", label: "AI Engineering" },
    { key: "peopleManagement", label: "People Mgmt" },
  ];

  return axes.map(({ key, label }) => {
    const axis = output.signalRadar[key];
    return {
      label,
      score: axis.score,
      insufficient: axis.score === 0 && axis.evidence.length === 0,
    };
  });
}

function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
