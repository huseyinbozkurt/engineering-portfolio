import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { getLatestSucceededLlmTask, type LlmTaskRecord } from "@portfolio/db/llm-tasks";
import type {
  CaseStudyRecord,
  ExperienceRecord,
  HomeContentRecord,
  PrincipleRecord,
  ProjectRecord,
  SkillRecord,
} from "@portfolio/db/queries";

import { ComingSoon } from "@/components/coming-soon";
import { EmptyState } from "@/components/empty-state";
import { getRecognitionItems } from "@/lib/portfolio-content";
import { getPublicSiteAvailability } from "@/lib/site-availability";

export const metadata: Metadata = {
  title: "AI Insights",
  description: "Read-only AI portfolio insights generated from the existing admin-managed data.",
  alternates: {
    canonical: "/ai-insights",
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PublicAiInsightsReport {
  generatedAt?: string | undefined;
  overallPortfolioStrength?: ScoreInsight | undefined;
  experienceCoverage?: ScoreInsight | undefined;
  technicalSkillDistribution?:
    | {
        summary?: string | undefined;
        segments?: Array<{ label: string; value: number; summary?: string | undefined }>;
        gaps?: string[];
      }
    | undefined;
  leadershipOwnershipSignals?:
    | {
        score?: number | undefined;
        summary?: string | undefined;
        signals?: InsightItem[];
      }
    | undefined;
  missingOrWeakAreas?: InsightItem[];
  recommendedImprovements?: InsightItem[];
  repeatedThemes?: string[];
  inconsistencies?: InsightItem[];
  groundedDataNotes?: string[];
}

interface ScoreInsight {
  score?: number | undefined;
  summary?: string | undefined;
  strengths?: string[];
  gaps?: string[];
  evidence?: string[];
}

interface InsightItem {
  title?: string | undefined;
  detail?: string | undefined;
  evidence?: string[];
}

interface DashboardModel {
  analysisDate: Date | null;
  dataSources: SourceSignal[];
  executiveSummary: {
    headline: string;
    strongestThemes: string[];
    growthAreas: string[];
  };
  metricCards: MetricSignal[];
  dna: ScoreDimension[];
  themes: ThemeSignal[];
  career: CareerSignal[];
  principles: PrincipleSignal[];
  roleFit: ScoreDimension[];
  evidenceNetwork: EvidenceNetwork;
  strengths: string[];
  risks: string[];
  recommendations: RecommendationSignal[];
  scorecard: ScoreDimension[];
  notes: string[];
  hasReport: boolean;
}

interface SourceSignal {
  label: string;
  count: number;
}

interface MetricSignal {
  label: string;
  value: string;
  detail: string;
  tone: "green" | "blue" | "violet" | "orange" | "amber";
}

interface ScoreDimension {
  label: string;
  score: number;
  detail?: string | undefined;
  tone: "green" | "blue" | "violet" | "orange" | "amber" | "red";
}

interface ThemeSignal {
  label: string;
  mentions: number;
  sources: string;
  score: number;
}

interface CareerSignal {
  id: string;
  year: string;
  title: string;
  detail: string;
  href: string;
  tone: "blue" | "violet" | "orange" | "green" | "amber";
}

interface PrincipleSignal extends ScoreDimension {
  evidence: string[];
  href: string;
}

interface EvidenceNetwork {
  center: string;
  left: EvidenceNode[];
  right: EvidenceNode[];
}

interface EvidenceNode {
  label: string;
  href: string;
  tone: ScoreDimension["tone"];
}

interface RecommendationSignal {
  title: string;
  detail: string;
  href?: string | undefined;
}

const toneStyles = {
  green: {
    icon: "text-emerald-300 bg-emerald-300/10 border-emerald-300/20",
    bar: "from-emerald-300 to-emerald-500",
    text: "text-emerald-200",
    ring: "#4ade80",
  },
  blue: {
    icon: "text-sky-300 bg-sky-300/10 border-sky-300/20",
    bar: "from-sky-300 to-sky-500",
    text: "text-sky-200",
    ring: "#38bdf8",
  },
  violet: {
    icon: "text-violet-300 bg-violet-300/10 border-violet-300/20",
    bar: "from-violet-300 to-violet-500",
    text: "text-violet-200",
    ring: "#a78bfa",
  },
  orange: {
    icon: "text-orange-300 bg-orange-300/10 border-orange-300/20",
    bar: "from-orange-300 to-orange-500",
    text: "text-orange-200",
    ring: "#fb923c",
  },
  amber: {
    icon: "text-amber-300 bg-amber-300/10 border-amber-300/20",
    bar: "from-amber-300 to-amber-500",
    text: "text-amber-200",
    ring: "#fbbf24",
  },
  red: {
    icon: "text-rose-300 bg-rose-300/10 border-rose-300/20",
    bar: "from-rose-300 to-rose-500",
    text: "text-rose-200",
    ring: "#fb7185",
  },
} as const;

const careerTones: CareerSignal["tone"][] = ["blue", "blue", "violet", "orange", "green", "amber"];
const metricTones: MetricSignal["tone"][] = ["green", "blue", "violet", "amber", "orange"];

export default async function AiInsightsPage() {
  const { content, shouldShowComingSoon } = await getPublicSiteAvailability();

  if (shouldShowComingSoon) {
    return <ComingSoon />;
  }

  const task = await getLatestReportTask();
  const report = isReport(task?.parsedResponse) ? task.parsedResponse : null;
  const dashboard = buildDashboardModel(content, report, task);

  if (!hasInsightData(dashboard)) {
    return (
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <EmptyState
          title="AI Insights are coming soon."
          description="Published portfolio records or the latest succeeded AI Insights report will appear here after they are available."
        />
      </section>
    );
  }

  return (
    <div className="mx-auto grid min-w-0 w-full max-w-[calc(80rem-2.5rem)] gap-4 overflow-hidden px-5 py-8 lg:max-w-[calc(80rem-4rem)] lg:px-8 lg:py-10">
      <InsightsHero dashboard={dashboard} />

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.15fr)_repeat(4,minmax(0,0.3fr))]">
        <ExecutiveSummary summary={dashboard.executiveSummary} />
        {dashboard.metricCards.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        {dashboard.dna.length > 0 ? <EngineeringDna dimensions={dashboard.dna} /> : null}
        {dashboard.themes.length > 0 ? <ThemeExtraction themes={dashboard.themes} /> : null}
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.04fr)_minmax(0,1.1fr)]">
        {dashboard.career.length > 0 ? <CareerEvolution items={dashboard.career} /> : null}
        {dashboard.principles.length > 0 ? (
          <PrincipleCoverage principles={dashboard.principles} />
        ) : null}
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.08fr)_minmax(0,0.82fr)]">
        {dashboard.roleFit.length > 0 ? <RoleFit roles={dashboard.roleFit} /> : null}
        <EvidenceNetworkPanel network={dashboard.evidenceNetwork} />
        <StrengthsRisks strengths={dashboard.strengths} risks={dashboard.risks} />
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
        {dashboard.recommendations.length > 0 ? (
          <Recommendations items={dashboard.recommendations} />
        ) : null}
        {dashboard.scorecard.length > 0 ? <PortfolioScorecard items={dashboard.scorecard} /> : null}
      </div>

      {dashboard.notes.length > 0 ? (
        <p className="pb-2 text-xs leading-6 text-muted">
          AI analysis is based on published portfolio content. Last updated{" "}
          {dashboard.analysisDate ? formatDateTime(dashboard.analysisDate) : "from portfolio data"}.
        </p>
      ) : null}
    </div>
  );
}

async function getLatestReportTask(): Promise<LlmTaskRecord | null> {
  try {
    return await getLatestSucceededLlmTask("ai_insights");
  } catch (error) {
    console.error("[public-ai-insights] read failed; treating as empty:", error);
    return null;
  }
}

function InsightsHero({ dashboard }: { dashboard: DashboardModel }) {
  return (
    <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)] lg:items-center">
      <div className="min-w-0 py-4">
        <p className="mb-4 text-sm font-semibold text-violet-300">AI Insights</p>
        <h1 className="text-4xl font-semibold leading-tight text-ink md:text-5xl">
          Portfolio intelligence from published work.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
          Data-driven insights generated from the public portfolio dataset.
        </p>
      </div>

      <div className="glass-panel grid min-w-0 gap-5 rounded-lg p-5 md:grid-cols-[minmax(0,1fr)_minmax(14rem,0.42fr)]">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink">Data Sources</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {dashboard.dataSources.map((source) => (
              <span
                key={source.label}
                className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/8 px-3 py-1.5 text-xs text-ink/90"
              >
                <span className="flex size-5 items-center justify-center rounded border border-violet-300/30 text-[0.65rem] text-violet-200">
                  {source.count}
                </span>
                {source.label}
              </span>
            ))}
          </div>
        </div>

        <div className="min-w-0 border-line pt-4 md:border-l md:pl-6 md:pt-0">
          <h2 className="text-sm font-semibold text-ink">Last Analysis</h2>
          <p className="mt-2 text-sm text-muted">
            {dashboard.analysisDate ? formatDateTime(dashboard.analysisDate) : "Portfolio-derived"}
          </p>
          <div className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-violet-300/40 bg-violet-400/15 px-4 text-sm font-semibold text-violet-100">
            {dashboard.hasReport ? "Latest report loaded" : "Awaiting AI report"}
          </div>
        </div>
      </div>
    </section>
  );
}

function ExecutiveSummary({ summary }: { summary: DashboardModel["executiveSummary"] }) {
  return (
    <InsightPanel className="min-h-72" index={1} title="Executive Summary">
      <p className="max-w-2xl text-xl font-medium leading-8 text-ink">{summary.headline}</p>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <SignalList title="Strongest themes" items={summary.strongestThemes} tone="violet" />
        <SignalList title="Potential growth areas" items={summary.growthAreas} tone="orange" />
      </div>
    </InsightPanel>
  );
}

function MetricCard({ metric }: { metric: MetricSignal }) {
  const tone = toneStyles[metric.tone];

  return (
    <article className="glass-panel min-w-0 rounded-lg p-5">
      <div
        className={`mb-5 flex size-11 items-center justify-center rounded-lg border ${tone.icon}`}
        aria-hidden
      >
        {metricIcon(metric.label)}
      </div>
      <p className="text-4xl font-semibold text-ink">{metric.value}</p>
      <h2 className="mt-3 text-sm font-semibold text-ink">{metric.label}</h2>
      <p className="mt-4 text-sm leading-6 text-muted">{metric.detail}</p>
    </article>
  );
}

function EngineeringDna({ dimensions }: { dimensions: ScoreDimension[] }) {
  return (
    <InsightPanel index={2} title="Engineering DNA">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(12rem,0.62fr)] md:items-center">
        <RadarChart dimensions={dimensions} />
        <div className="grid gap-3">
          {dimensions.map((dimension) => (
            <div key={dimension.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-muted">
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-md border ${toneStyles[dimension.tone].icon}`}
                  aria-hidden
                >
                  {dimension.label.slice(0, 1)}
                </span>
                <span className="truncate">{dimension.label}</span>
              </span>
              <span className="font-semibold text-ink">{dimension.score}</span>
            </div>
          ))}
          <p className="pt-2 text-xs leading-5 text-muted">
            Scores combine the latest report with portfolio coverage, case study completeness, and
            published evidence.
          </p>
        </div>
      </div>
    </InsightPanel>
  );
}

function ThemeExtraction({ themes }: { themes: ThemeSignal[] }) {
  const maxMentions = Math.max(1, ...themes.map((theme) => theme.mentions));

  return (
    <InsightPanel index={3} title="Theme Extraction" actionLabel="Mentions in content">
      <div className="grid gap-5">
        {themes.map((theme) => (
          <div key={theme.label} className="grid gap-2 md:grid-cols-[minmax(0,0.42fr)_1fr_auto] md:items-center">
            <div>
              <h3 className="text-sm font-semibold text-ink">{theme.label}</h3>
              <p className="mt-1 text-xs text-muted">{theme.sources}</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/7">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-400 to-violet-300"
                style={{ width: `${Math.max(10, (theme.mentions / maxMentions) * 100)}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-ink">{theme.mentions}</span>
          </div>
        ))}
      </div>
      <Link
        href="/case-studies"
        className="mt-6 inline-flex text-sm font-semibold text-violet-300 transition hover:text-violet-200"
      >
        View all evidence <span className="ml-2" aria-hidden>→</span>
      </Link>
    </InsightPanel>
  );
}

function CareerEvolution({ items }: { items: CareerSignal[] }) {
  return (
    <InsightPanel index={4} title="Career Evolution">
      <ol className="relative grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <li className="absolute left-5 right-5 top-11 hidden h-px bg-line sm:block" aria-hidden />
        {items.map((item) => (
          <li key={item.id} className="relative min-w-0">
            <Link href={item.href} className="group block rounded-lg p-3 transition hover:bg-white/[0.04]">
              <span
                className={`relative z-10 mb-5 flex size-11 items-center justify-center rounded-lg border ${toneStyles[item.tone].icon}`}
                aria-hidden
              >
                {item.title.slice(0, 1)}
              </span>
              <p className={`text-sm font-semibold ${toneStyles[item.tone].text}`}>{item.year}</p>
              <h3 className="mt-2 text-sm font-semibold text-ink">{item.title}</h3>
              <p className="mt-3 text-xs leading-5 text-muted">{item.detail}</p>
            </Link>
          </li>
        ))}
      </ol>
    </InsightPanel>
  );
}

function PrincipleCoverage({ principles }: { principles: PrincipleSignal[] }) {
  return (
    <InsightPanel index={5} title="Principle Coverage" actionLabel="Coverage across portfolio">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(13rem,0.8fr)]">
        <div className="grid gap-5">
          {principles.map((principle) => (
            <Link key={principle.label} href={principle.href} className="group grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-3 text-sm font-semibold text-ink">
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${toneStyles[principle.tone].icon}`}
                    aria-hidden
                  >
                    {principle.label.slice(0, 1)}
                  </span>
                  <span className="truncate">{principle.label}</span>
                </span>
                <span className="text-sm font-semibold text-ink">{principle.score}%</span>
              </div>
              <div className="ml-12 h-2 overflow-hidden rounded-full bg-white/7">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${toneStyles[principle.tone].bar}`}
                  style={{ width: `${principle.score}%` }}
                />
              </div>
            </Link>
          ))}
        </div>
        <div className="rounded-lg border border-line bg-white/[0.025] p-4">
          {principles.map((principle) => (
            <div key={principle.href} className="border-b border-line/70 py-3 first:pt-0 last:border-0 last:pb-0">
              <h3 className="text-sm font-semibold text-ink">{principle.label}</h3>
              {principle.evidence.length > 0 ? (
                <ul className="mt-2 grid gap-1 text-xs leading-5 text-muted">
                  {principle.evidence.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </InsightPanel>
  );
}

function RoleFit({ roles }: { roles: ScoreDimension[] }) {
  return (
    <InsightPanel index={6} title="Role Fit Analysis" description="Best fit roles for the profile">
      <ScoreBars items={roles} />
      <p className="mt-5 text-xs leading-5 text-muted">
        Scores are based on published experience, skills, case studies, and AI report signals.
      </p>
    </InsightPanel>
  );
}

function EvidenceNetworkPanel({ network }: { network: EvidenceNetwork }) {
  return (
    <InsightPanel index={7} title="Evidence Network">
      <div className="grid min-h-72 min-w-0 gap-5">
        <div className="flex justify-center">
          <div className="flex min-h-24 max-w-56 items-center justify-center rounded-full border border-violet-300/40 bg-violet-400/25 px-5 text-center text-sm font-semibold text-violet-100 shadow-[0_0_42px_rgba(139,92,246,0.2)]">
            {network.center}
          </div>
        </div>
        <div className="grid min-w-0 gap-3">
          <NodeColumn nodes={network.left} align="left" />
          <NodeColumn nodes={network.right} align="left" />
        </div>
      </div>
      <Link
        href="/how-i-work"
        className="mt-4 inline-flex text-sm font-semibold text-violet-300 transition hover:text-violet-200"
      >
        View principle graph <span className="ml-2" aria-hidden>→</span>
      </Link>
    </InsightPanel>
  );
}

function StrengthsRisks({ strengths, risks }: { strengths: string[]; risks: string[] }) {
  return (
    <InsightPanel index={8} title="Strengths & Risks">
      {strengths.length > 0 ? (
        <CheckList title="Strengths" items={strengths} tone="green" />
      ) : null}
      {risks.length > 0 ? (
        <div className="mt-5 border-t border-line pt-5">
          <CheckList title="Potential Blind Spots" items={risks} tone="red" />
        </div>
      ) : null}
    </InsightPanel>
  );
}

function Recommendations({ items }: { items: RecommendationSignal[] }) {
  return (
    <InsightPanel index={9} title="AI Recommendations" description="Based on portfolio data">
      <div className="grid gap-3">
        {items.map((item) => {
          const content = (
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-line bg-white/[0.025] p-3 transition hover:bg-white/[0.05]">
              <span className="flex size-8 items-center justify-center rounded-lg border border-violet-300/20 bg-violet-300/10 text-violet-200">
                {item.title.slice(0, 1)}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink">{item.title}</span>
                <span className="mt-1 block text-xs leading-5 text-muted">{item.detail}</span>
              </span>
              <span className="text-violet-300" aria-hidden>
                →
              </span>
            </div>
          );

          return item.href ? (
            <Link key={item.title} href={item.href}>
              {content}
            </Link>
          ) : (
            <div key={item.title}>{content}</div>
          );
        })}
      </div>
    </InsightPanel>
  );
}

function PortfolioScorecard({ items }: { items: ScoreDimension[] }) {
  return (
    <InsightPanel index={10} title="Portfolio Scorecard" description="Completeness of the portfolio">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <RingScore item={item} />
            <h3 className="mt-3 text-sm font-semibold text-ink">{item.label}</h3>
            <p className="mt-1 text-sm text-muted">{item.score}%</p>
          </div>
        ))}
      </div>
    </InsightPanel>
  );
}

function InsightPanel({
  index,
  title,
  description,
  actionLabel,
  className,
  children,
}: {
  index: number;
  title: string;
  description?: string | undefined;
  actionLabel?: string | undefined;
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <section className={`glass-panel min-w-0 rounded-lg p-5 ${className ?? ""}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-3 text-lg font-semibold text-ink">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-violet-400 text-xs font-bold text-white">
              {index}
            </span>
            {title}
          </h2>
          {description ? <p className="mt-1 text-xs text-muted">{description}</p> : null}
        </div>
        {actionLabel ? <p className="text-xs text-muted">{actionLabel}</p> : null}
      </div>
      {children}
    </section>
  );
}

function SignalList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "violet" | "orange";
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-xs font-semibold text-muted">{title}</h3>
      <ol className="mt-3 grid gap-2">
        {items.map((item, index) => (
          <li key={item} className="flex items-start gap-2 text-sm leading-5 text-muted">
            <span
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                tone === "violet" ? "bg-violet-400 text-white" : "bg-orange-400 text-slate-950"
              }`}
            >
              {index + 1}
            </span>
            {item}
          </li>
        ))}
      </ol>
    </div>
  );
}

function RadarChart({ dimensions }: { dimensions: ScoreDimension[] }) {
  const size = 260;
  const center = size / 2;
  const radius = 86;
  const points = dimensions.map((dimension, index) =>
    radarPoint(index, dimensions.length, center, radius * (dimension.score / 100)),
  );
  const polygon = points.map((point) => `${point.x},${point.y}`).join(" ");
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <div className="mx-auto w-full max-w-80">
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Engineering DNA radar chart">
        {rings.map((ring) => (
          <polygon
            key={ring}
            points={dimensions
              .map((_, index) => radarPoint(index, dimensions.length, center, radius * ring))
              .map((point) => `${point.x},${point.y}`)
              .join(" ")}
            fill="none"
            stroke="rgba(167,139,250,0.22)"
            strokeWidth="1"
          />
        ))}
        {dimensions.map((dimension, index) => {
          const outer = radarPoint(index, dimensions.length, center, radius);
          const label = radarPoint(index, dimensions.length, center, radius + 30);

          return (
            <g key={dimension.label}>
              <line
                x1={center}
                y1={center}
                x2={outer.x}
                y2={outer.y}
                stroke="rgba(167,139,250,0.18)"
              />
              <text
                x={label.x}
                y={label.y}
                fill="#f6f7f9"
                fontSize="11"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {dimension.label}
              </text>
              <text
                x={label.x}
                y={label.y + 13}
                fill="#c4b5fd"
                fontSize="10"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {dimension.score}
              </text>
            </g>
          );
        })}
        <polygon points={polygon} fill="rgba(139,92,246,0.32)" stroke="#a78bfa" strokeWidth="2" />
        {points.map((point, index) => (
          <circle
            key={`${dimensions[index]?.label ?? index}-point`}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="#c4b5fd"
          />
        ))}
      </svg>
    </div>
  );
}

function ScoreBars({ items }: { items: ScoreDimension[] }) {
  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <div key={item.label} className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-ink">{item.label}</h3>
            <span className="text-sm font-semibold text-ink">{item.score}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/7">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${toneStyles[item.tone].bar}`}
              style={{ width: `${item.score}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function NodeColumn({ nodes, align }: { nodes: EvidenceNode[]; align: "left" | "right" }) {
  return (
    <div
      className={`grid min-w-0 gap-3 ${align === "right" ? "md:justify-items-end" : "md:justify-items-start"}`}
    >
      {nodes.map((node) => (
        <Link
          key={`${node.href}-${node.label}`}
          href={node.href}
          className={`inline-flex w-full min-w-0 rounded-full border px-3 py-2 text-xs font-semibold transition hover:bg-white/[0.06] ${toneStyles[node.tone].icon}`}
        >
          <span className="truncate">{node.label}</span>
        </Link>
      ))}
    </div>
  );
}

function CheckList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "green" | "red";
}) {
  return (
    <div>
      <h3 className={`text-sm font-semibold ${toneStyles[tone].text}`}>{title}</h3>
      <ul className="mt-3 grid gap-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm leading-5 text-muted">
            <span className={toneStyles[tone].text} aria-hidden>
              {tone === "green" ? "✓" : "△"}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RingScore({ item }: { item: ScoreDimension }) {
  const tone = toneStyles[item.tone];

  return (
    <div
      className="mx-auto flex size-20 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(${tone.ring} ${item.score * 3.6}deg, rgba(255,255,255,0.11) 0deg)`,
      }}
      aria-label={`${item.label} ${item.score}%`}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-[#07111d] text-sm font-semibold text-ink">
        {item.score}
      </div>
    </div>
  );
}

function buildDashboardModel(
  content: HomeContentRecord,
  report: PublicAiInsightsReport | null,
  task: LlmTaskRecord | null,
): DashboardModel {
  const recognitionItems = getRecognitionItems(content.experiences);
  const corpus = buildCorpus(content);
  const analysisDate = getAnalysisDate(report, task);
  const dataSources = [
    { label: "Experiences", count: content.experiences.length },
    { label: "Case Studies", count: content.caseStudies.length },
    { label: "Projects", count: content.projects.length },
    { label: "Principles", count: content.principles.length },
    { label: "Recognition", count: recognitionItems.length },
  ].filter((source) => source.count > 0);

  const dna = getDnaScores(content, report, corpus);
  const themes = getThemeSignals(content, report, corpus);
  const principles = getPrincipleSignals(content, corpus);
  const strengths = uniqueStrings([
    ...(report?.overallPortfolioStrength?.strengths ?? []),
    ...(report?.experienceCoverage?.strengths ?? []),
    ...(report?.leadershipOwnershipSignals?.signals?.map((signal) => signal.title ?? "") ?? []),
  ])
    .filter(Boolean)
    .slice(0, 5);
  const risks = uniqueStrings([
    ...(report?.overallPortfolioStrength?.gaps ?? []),
    ...(report?.experienceCoverage?.gaps ?? []),
    ...(report?.technicalSkillDistribution?.gaps ?? []),
    ...(report?.missingOrWeakAreas?.map((item) => item.title || item.detail || "") ?? []),
    ...(report?.inconsistencies?.map((item) => item.title || item.detail || "") ?? []),
  ])
    .filter(Boolean)
    .slice(0, 5);

  return {
    analysisDate,
    dataSources,
    executiveSummary: {
      headline: getSummaryHeadline(content, report),
      strongestThemes: getStrongestThemes(content, report, themes),
      growthAreas: getGrowthAreas(content, report, risks),
    },
    metricCards: getMetricCards(content, recognitionItems),
    dna,
    themes,
    career: getCareerSignals(content.experiences),
    principles,
    roleFit: getRoleFitScores(content, report, dna),
    evidenceNetwork: getEvidenceNetwork(content, themes, principles),
    strengths,
    risks,
    recommendations: getRecommendations(content, report),
    scorecard: getScorecard(content, recognitionItems),
    notes: report?.groundedDataNotes?.slice(0, 3) ?? [],
    hasReport: Boolean(report),
  };
}

function getSummaryHeadline(content: HomeContentRecord, report: PublicAiInsightsReport | null): string {
  const reportSummary =
    report?.overallPortfolioStrength?.summary ||
    report?.leadershipOwnershipSignals?.summary ||
    report?.experienceCoverage?.summary;

  if (reportSummary) {
    return reportSummary;
  }

  const currentRole = content.experiences.find((experience) => experience.isCurrent)?.role;
  const caseStudyCount = content.caseStudies.length;
  const principleCount = content.principles.length;

  return [
    currentRole ? `${currentRole} profile` : "Engineering profile",
    caseStudyCount > 0 ? `with ${caseStudyCount} published impact stories` : "",
    principleCount > 0 ? `and ${principleCount} operating principles` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function getStrongestThemes(
  content: HomeContentRecord,
  report: PublicAiInsightsReport | null,
  themes: ThemeSignal[],
): string[] {
  const reportThemes = report?.repeatedThemes?.filter(Boolean) ?? [];

  if (reportThemes.length > 0) {
    return reportThemes.slice(0, 4);
  }

  return uniqueStrings([
    ...themes.map((theme) => theme.label),
    ...content.principles.map((principle) => principle.title),
  ]).slice(0, 4);
}

function getGrowthAreas(
  content: HomeContentRecord,
  report: PublicAiInsightsReport | null,
  risks: string[],
): string[] {
  if (risks.length > 0) {
    return risks.slice(0, 4);
  }

  const recommendations = getRecommendations(content, report).map((item) => item.title);

  return recommendations.slice(0, 4);
}

function getMetricCards(
  content: HomeContentRecord,
  recognitionItems: ReturnType<typeof getRecognitionItems>,
): MetricSignal[] {
  const years = getTotalExperienceYears(content.experiences);
  const companies = uniqueStrings(content.experiences.map((experience) => experience.company).filter(Boolean));
  const metrics: MetricSignal[] = [
    years > 0
      ? {
          label: "Years Experience",
          value: `${years}+`,
          detail: getExperienceYearRange(content.experiences),
          tone: "green",
        }
      : null,
    companies.length > 0
      ? {
          label: "Companies",
          value: `${companies.length}`,
          detail: "Worked With",
          tone: "blue",
        }
      : null,
    content.caseStudies.length > 0
      ? {
          label: "Case Studies",
          value: `${content.caseStudies.length}+`,
          detail: "Published",
          tone: "violet",
        }
      : null,
    recognitionItems.length > 0
      ? {
          label: "Award",
          value: `${recognitionItems.length}`,
          detail: "Received",
          tone: "amber",
        }
      : null,
  ].filter((metric): metric is MetricSignal => Boolean(metric));

  return metrics.map((metric, index) => ({
    ...metric,
    tone: metric.tone ?? metricTones[index % metricTones.length] ?? "violet",
  }));
}

function getDnaScores(
  content: HomeContentRecord,
  report: PublicAiInsightsReport | null,
  corpus: string,
): ScoreDimension[] {
  const caseStudyCoverage = getCaseStudyCoverageScore(content.caseStudies);
  const skillCoverage = clampScore(content.skills.length * 5);
  const ownershipScore = report?.leadershipOwnershipSignals?.score ?? termScore(corpus, ["own", "owner", "ownership"]);
  const overallScore = report?.overallPortfolioStrength?.score ?? average([caseStudyCoverage, skillCoverage]);
  const experienceScore = report?.experienceCoverage?.score ?? clampScore(content.experiences.length * 15);

  return [
    {
      label: "Ownership",
      score: clampScore(ownershipScore || overallScore),
      tone: "violet",
    },
    {
      label: "Quality",
      score: clampScore(caseStudyCoverage),
      tone: "amber",
    },
    {
      label: "Leadership",
      score: clampScore(average([experienceScore, ownershipScore || experienceScore])),
      tone: "orange",
    },
    {
      label: "Delivery",
      score: clampScore(content.projects.length * 16 + content.caseStudies.length * 6),
      tone: "green",
    },
    {
      label: "Architecture",
      score: clampScore(skillCoverage + termScore(corpus, ["architecture", "system", "platform"]) / 3),
      tone: "blue",
    },
    {
      label: "Communication",
      score: clampScore(average([overallScore, experienceScore])),
      tone: "violet",
    },
  ];
}

function getThemeSignals(
  content: HomeContentRecord,
  report: PublicAiInsightsReport | null,
  corpus: string,
): ThemeSignal[] {
  const reportThemes = report?.repeatedThemes ?? [];
  const skillCategories = uniqueStrings(
    content.skills.map((skill) => skill.category?.trim()).filter((category): category is string => Boolean(category)),
  );
  const labels = uniqueStrings([
    ...reportThemes,
    ...skillCategories,
    ...content.principles.map((principle) => principle.title),
  ])
    .filter(Boolean)
    .slice(0, 6);

  return labels
    .map((label) => {
      const mentions = Math.max(
        countThemeMentions(corpus, label),
        countThemeMentions(buildRecordsText(content.caseStudies), label) +
          countThemeMentions(buildRecordsText(content.experiences), label),
      );
      const experienceMentions = countRecordsWithTheme(content.experiences, label);
      const caseStudyMentions = countRecordsWithTheme(content.caseStudies, label);

      return {
        label,
        mentions,
        sources: `${experienceMentions} Experiences · ${caseStudyMentions} Case Studies`,
        score: clampScore(mentions * 7),
      };
    })
    .filter((theme) => theme.mentions > 0)
    .sort((left, right) => right.mentions - left.mentions || left.label.localeCompare(right.label))
    .slice(0, 5);
}

function getCareerSignals(experiences: ExperienceRecord[]): CareerSignal[] {
  const chronological = [...experiences].reverse();
  const limited = takeEvenly(chronological, 5);

  return limited.map((experience, index) => ({
    id: experience.id,
    year: getYearLabel(experience),
    title: getCareerTitle(experience),
    detail: firstSentence(experience.summary) || experience.role,
    href: `/experience/${experience.slug || experience.id}`,
    tone: careerTones[index % careerTones.length] ?? "blue",
  }));
}

function getPrincipleSignals(content: HomeContentRecord, corpus: string): PrincipleSignal[] {
  return content.principles.slice(0, 4).map((principle, index) => {
    const mentions = countThemeMentions(corpus, principle.title);
    const evidence = getEvidenceForPrinciple(content, principle);

    return {
      label: principle.title,
      score: clampScore(70 + mentions * 4 + evidence.length * 5),
      detail: principle.summary,
      tone: careerTones[index % careerTones.length] ?? "violet",
      evidence,
      href: `/how-i-work#${principle.slug || principle.id}`,
    };
  });
}

function getRoleFitScores(
  content: HomeContentRecord,
  report: PublicAiInsightsReport | null,
  dna: ScoreDimension[],
): ScoreDimension[] {
  const roleNames = uniqueStrings([
    ...content.experiences.map((experience) => experience.role).filter(Boolean),
    ...content.skills
      .map((skill) => skill.category?.trim())
      .filter((category): category is string => Boolean(category))
      .slice(0, 2)
      .map((category) => `${category} Engineer`),
  ]).slice(0, 5);
  const base = report?.overallPortfolioStrength?.score ?? average(dna.map((dimension) => dimension.score));

  return roleNames.map((role, index) => ({
    label: role,
    score: clampScore(base - index * 6 + countThemeMentions(role.toLowerCase(), "senior") * 3),
    tone: careerTones[index % careerTones.length] ?? "blue",
  }));
}

function getEvidenceNetwork(
  content: HomeContentRecord,
  themes: ThemeSignal[],
  principles: PrincipleSignal[],
): EvidenceNetwork {
  const center = principles[0]?.label ?? themes[0]?.label ?? "Portfolio";
  const companies = uniqueStrings(content.experiences.map((experience) => experience.company).filter(Boolean))
    .slice(0, 3)
    .map((company, index) => ({
      label: company,
      href: "/experience",
      tone: careerTones[index % careerTones.length] ?? "blue",
    }));
  const caseStudies = content.caseStudies.slice(0, 3).map((caseStudy, index) => ({
    label: caseStudy.title,
    href: `/case-studies/${caseStudy.slug}`,
    tone: careerTones[(index + 2) % careerTones.length] ?? "violet",
  }));
  const projects = content.projects.slice(0, 3).map((project, index) => ({
    label: project.name,
    href: `/projects/${project.slug || project.id}`,
    tone: careerTones[(index + 3) % careerTones.length] ?? "green",
  }));

  return {
    center,
    left: [...companies, ...caseStudies].slice(0, 5),
    right: [
      ...projects,
      ...themes.slice(0, 3).map((theme, index) => ({
        label: theme.label,
        href: "/case-studies",
        tone: careerTones[(index + 1) % careerTones.length] ?? "violet",
      })),
    ].slice(0, 5),
  };
}

function getRecommendations(
  content: HomeContentRecord,
  report: PublicAiInsightsReport | null,
): RecommendationSignal[] {
  const reportRecommendations =
    report?.recommendedImprovements
      ?.map((item) => ({
        title: item.title || "Portfolio improvement",
        detail: item.detail || item.evidence?.join(", ") || "Improve the existing portfolio evidence.",
      }))
      .filter((item) => item.title || item.detail) ?? [];

  if (reportRecommendations.length > 0) {
    return reportRecommendations.slice(0, 3);
  }

  const recommendations: RecommendationSignal[] = [];
  const incompleteCaseStudy = content.caseStudies.find((caseStudy) =>
    [
      caseStudy.context,
      caseStudy.problem,
      caseStudy.constraints,
      caseStudy.action,
      caseStudy.tradeoffs,
      caseStudy.outcome,
      caseStudy.learning,
    ].some((value) => !value.trim()),
  );

  if (incompleteCaseStudy) {
    recommendations.push({
      title: `Complete ${incompleteCaseStudy.title}`,
      detail: "Add missing case study sections so the impact story has full evidence coverage.",
      href: `/case-studies/${incompleteCaseStudy.slug}`,
    });
  }

  const projectWithoutLinks = content.projects.find((project) => !project.url && !project.githubUrl);

  if (projectWithoutLinks) {
    recommendations.push({
      title: `Add links for ${projectWithoutLinks.name}`,
      detail: "A public URL or repository link would strengthen project verification.",
      href: `/projects/${projectWithoutLinks.slug || projectWithoutLinks.id}`,
    });
  }

  if (getRecognitionItems(content.experiences).length === 0 && content.experiences.length > 0) {
    recommendations.push({
      title: "Add recognition evidence",
      detail: "Published experience records can include awards, feedback, or recognition notes.",
      href: "/recognition",
    });
  }

  return recommendations.slice(0, 3);
}

function getScorecard(
  content: HomeContentRecord,
  recognitionItems: ReturnType<typeof getRecognitionItems>,
): ScoreDimension[] {
  const aiSkillCount = content.skills.filter((skill) =>
    [skill.name, skill.category, skill.summary].some((value) => /ai|llm|automation/i.test(value ?? "")),
  ).length;

  const items: ScoreDimension[] = [
    {
      label: "Experience",
      score: clampScore(content.experiences.length * 18),
      tone: "green",
    },
    {
      label: "Case Studies",
      score: getCaseStudyCoverageScore(content.caseStudies),
      tone: "blue",
    },
    {
      label: "Projects",
      score: clampScore(content.projects.length * 35 + linkedProjectRatio(content.projects) * 30),
      tone: "violet",
    },
    {
      label: "Recognition",
      score: clampScore(recognitionItems.length * 35),
      tone: "orange",
    },
    {
      label: "AI Engineering",
      score: clampScore(aiSkillCount * 25),
      tone: "amber",
    },
    {
      label: "Architecture Decisions",
      score: clampScore(content.principles.length * 12 + content.caseStudies.length * 3),
      tone: "red",
    },
  ];

  return items.filter((item) => item.score > 0);
}

function hasInsightData(dashboard: DashboardModel): boolean {
  return (
    dashboard.dataSources.length > 0 ||
    dashboard.metricCards.length > 0 ||
    dashboard.hasReport ||
    dashboard.scorecard.length > 0
  );
}

function buildCorpus(content: HomeContentRecord): string {
  return [
    buildRecordsText(content.experiences),
    buildRecordsText(content.projects),
    buildRecordsText(content.caseStudies),
    buildRecordsText(content.principles),
    buildRecordsText(content.skills),
  ]
    .join(" ")
    .toLowerCase();
}

function buildRecordsText(
  records: Array<ExperienceRecord | ProjectRecord | CaseStudyRecord | PrincipleRecord | SkillRecord>,
): string {
  return records
    .map((record) => {
      if ("company" in record) {
        return [record.company, record.role, record.summary, record.details, record.awards].join(" ");
      }

      if ("name" in record && "description" in record) {
        return [
          record.name,
          record.description,
          record.details,
          record.architecture,
          record.developmentTechStack,
          record.qaTechStack,
          record.aiIntegrationTechStack,
          record.deploymentTechStack,
        ].join(" ");
      }

      if ("title" in record && "excerpt" in record) {
        return [
          record.title,
          record.excerpt,
          record.context,
          record.problem,
          record.constraints,
          record.action,
          record.tradeoffs,
          record.outcome,
          record.learning,
        ].join(" ");
      }

      if ("title" in record) {
        return [record.title, record.summary, record.body].join(" ");
      }

      return [record.name, record.summary, record.category].join(" ");
    })
    .join(" ");
}

function countRecordsWithTheme(
  records: Array<ExperienceRecord | CaseStudyRecord>,
  theme: string,
): number {
  return records.filter((record) => countThemeMentions(buildRecordsText([record]).toLowerCase(), theme) > 0).length;
}

function countThemeMentions(text: string, theme: string): number {
  const words = theme
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2);

  if (words.length === 0) {
    return 0;
  }

  return words.reduce((total, word) => {
    const matches = text.match(new RegExp(`\\b${escapeRegExp(word)}\\w*\\b`, "g"));
    return total + (matches?.length ?? 0);
  }, 0);
}

function termScore(text: string, terms: string[]): number {
  return clampScore(
    terms.reduce((total, term) => total + countThemeMentions(text, term), 0) * 10,
  );
}

function getEvidenceForPrinciple(content: HomeContentRecord, principle: PrincipleRecord): string[] {
  const titleWords = principle.title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3);
  const evidence = [
    ...content.caseStudies.map((caseStudy) => ({
      title: caseStudy.title,
      text: buildRecordsText([caseStudy]).toLowerCase(),
    })),
    ...content.experiences.map((experience) => ({
      title: `${experience.company} / ${experience.role}`,
      text: buildRecordsText([experience]).toLowerCase(),
    })),
  ];

  return evidence
    .filter((item) => titleWords.some((word) => item.text.includes(word)))
    .map((item) => item.title)
    .slice(0, 3);
}

function getCaseStudyCoverageScore(caseStudies: CaseStudyRecord[]): number {
  if (caseStudies.length === 0) {
    return 0;
  }

  const sectionCount = 7;
  const completed = caseStudies.reduce((total, caseStudy) => {
    const fields = [
      caseStudy.context,
      caseStudy.problem,
      caseStudy.constraints,
      caseStudy.action,
      caseStudy.tradeoffs,
      caseStudy.outcome,
      caseStudy.learning,
    ];

    return total + fields.filter((field) => field.trim()).length;
  }, 0);

  return clampScore((completed / (caseStudies.length * sectionCount)) * 100);
}

function linkedProjectRatio(projects: ProjectRecord[]): number {
  if (projects.length === 0) {
    return 0;
  }

  const linked = projects.filter((project) => project.url || project.githubUrl).length;
  return linked / projects.length;
}

function getAnalysisDate(
  report: PublicAiInsightsReport | null,
  task: LlmTaskRecord | null,
): Date | null {
  if (task?.completedAt) {
    return task.completedAt;
  }

  if (report?.generatedAt) {
    const date = new Date(report.generatedAt);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function getTotalExperienceYears(experiences: ExperienceRecord[]): number {
  const dates = experiences
    .flatMap((experience) => [
      parseDate(experience.startDate),
      experience.isCurrent ? new Date() : parseDate(experience.endDate),
    ])
    .filter((date): date is Date => Boolean(date));

  if (dates.length === 0) {
    return 0;
  }

  const earliest = new Date(Math.min(...dates.map((date) => date.getTime())));
  const latest = new Date(Math.max(...dates.map((date) => date.getTime())));

  return Math.max(1, latest.getUTCFullYear() - earliest.getUTCFullYear());
}

function getExperienceYearRange(experiences: ExperienceRecord[]): string {
  const startYears = experiences
    .map((experience) => parseDate(experience.startDate)?.getUTCFullYear())
    .filter((year): year is number => Boolean(year));
  const earliest = Math.min(...startYears);

  if (!Number.isFinite(earliest)) {
    return "Published experience";
  }

  return `${earliest} - Present`;
}

function getYearLabel(experience: ExperienceRecord): string {
  const startYear = parseDate(experience.startDate)?.getUTCFullYear();
  const endYear = experience.isCurrent ? "Present" : parseDate(experience.endDate)?.getUTCFullYear();

  if (startYear && endYear && startYear !== endYear) {
    return `${startYear} - ${endYear}`;
  }

  return `${startYear ?? endYear ?? "Current"}`;
}

function getCareerTitle(experience: ExperienceRecord): string {
  const role = experience.role.trim();

  if (role.length <= 24) {
    return role;
  }

  return role.replace(/\s+Engineer$/i, "").trim() || role;
}

function firstSentence(value: string): string {
  const compact = value.replace(/\s+/g, " ").trim();
  const match = compact.match(/^(.+?[.!?])(?:\s|$)/);

  return (match?.[1] ?? compact).slice(0, 140);
}

function parseDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function takeEvenly<T>(items: T[], maxItems: number): T[] {
  if (items.length <= maxItems) {
    return items;
  }

  return Array.from({ length: maxItems }, (_, index) => {
    const sourceIndex = Math.round((index / (maxItems - 1)) * (items.length - 1));
    return items[sourceIndex];
  }).filter((item): item is T => Boolean(item));
}

function radarPoint(index: number, total: number, center: number, radius: number): { x: number; y: number } {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;

  return {
    x: Math.round((center + Math.cos(angle) * radius) * 100) / 100,
    y: Math.round((center + Math.sin(angle) * radius) * 100) / 100,
  };
}

function average(values: number[]): number {
  const filtered = values.filter((value) => Number.isFinite(value) && value > 0);

  if (filtered.length === 0) {
    return 0;
  }

  return filtered.reduce((total, value) => total + value, 0) / filtered.length;
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function metricIcon(label: string): string {
  if (/experience/i.test(label)) return "↗";
  if (/companies/i.test(label)) return "▣";
  if (/case/i.test(label)) return "◰";
  if (/award|recognition/i.test(label)) return "★";
  return "◆";
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isReport(value: unknown): value is PublicAiInsightsReport {
  return Boolean(value && typeof value === "object");
}
