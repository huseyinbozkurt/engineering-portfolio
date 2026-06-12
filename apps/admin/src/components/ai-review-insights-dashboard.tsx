import Link from "next/link";

import type {
  AggregatedFinding,
  AiReviewInsights,
  AttentionItem,
  ContentTypeComparison,
  QualityTrendPoint,
} from "@/lib/ai-review-insights";
import { ClampedText } from "@/components/ui";
import {
  PREVIEW_SUBTITLE_LINES,
  PREVIEW_TITLE_LINES,
  WIDGET_MAX_CONTENT_H,
} from "@/lib/content-density";

interface AiReviewInsightsDashboardProps {
  insights: AiReviewInsights;
}

const FINDING_COLORS = ["#38bdf8", "#34d399", "#fbbf24", "#fb7185", "#a78bfa", "#2dd4bf"];

export function AiReviewInsightsDashboard({ insights }: AiReviewInsightsDashboardProps) {
  const hasReviews = insights.reviewedCount > 0;

  return (
    <section className="mt-10" aria-labelledby="ai-review-insights-title">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ui-eyebrow">Admin only</p>
          <h2 id="ai-review-insights-title" className="ui-section-title mt-1">
            AI Review Insights
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
            Portfolio-level intelligence from completed Experience, Project, and Case Study AI reviews.
          </p>
        </div>
        {insights.reviewedCount > 0 && insights.reviewedCount < insights.totalCount ? (
          <span className="ui-chip">
            Based on {insights.reviewedCount} of {insights.totalCount} reviewed records
          </span>
        ) : null}
      </div>

      {!hasReviews ? (
        <div className="rounded-2xl border border-dashed border-line bg-white/[0.02] p-8">
          <h3 className="text-lg font-semibold text-ink">Run AI Reviews to generate portfolio insights.</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            The dashboard aggregates completed AI reviews only. Review Experiences, Projects, and Case Studies to unlock strengths, improvement areas, suggestions, and quality trends.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {insights.failedCount > 0 ? (
            <p className="rounded-lg border border-warning-300/30 bg-warning-500/10 px-4 py-3 text-sm text-warning-100">
              Some insights may be incomplete because {insights.failedCount} review{insights.failedCount === 1 ? "" : "s"} failed.
            </p>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr_1.4fr]">
            <PortfolioHealthCard insights={insights} />
            <ReviewCoverageCard comparisons={insights.comparisons} />
            <AttentionRequiredCard items={insights.attention} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <FindingCard
              title="Top Strengths"
              description="Recurring strengths grouped across completed reviews."
              findings={insights.strengths}
              tone="strength"
            />
            <FindingCard
              title="Most Common Improvement Areas"
              description="Repeated issues ranked by frequency and quality impact."
              findings={insights.issues}
              tone="issue"
            />
          </div>

          <SuggestionsHeatmap findings={insights.suggestions} />

          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <QualityTrendCard points={insights.trend} trendDelta={insights.trendDelta} />
            <ContentTypeComparisonCard comparisons={insights.comparisons} />
          </div>
        </div>
      )}
    </section>
  );
}

function PortfolioHealthCard({ insights }: { insights: AiReviewInsights }) {
  return (
    <article className="ui-card p-5 shadow-card">
      <p className="ui-eyebrow">Portfolio Health</p>
      <div className="mt-4 flex items-end gap-3">
        <p className="text-5xl font-semibold tracking-tight text-ink tabular-nums">
          {insights.portfolioScore ?? "-"}
        </p>
        <p className="pb-2 text-lg font-medium text-muted">/ 100</p>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-success-400"
          style={{ width: `${Math.max(2, insights.portfolioScore ?? 0)}%` }}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="ui-chip">{insights.reviewedCount} reviewed</span>
        <TrendChip delta={insights.trendDelta} />
      </div>
    </article>
  );
}

function TrendChip({ delta }: { delta: number | null }) {
  if (delta === null) {
    return <span className="ui-chip">Trend pending</span>;
  }

  const label = delta === 0 ? "No change" : `${delta > 0 ? "+" : ""}${delta} trend`;
  const className = delta >= 0 ? "ui-badge-success" : "ui-badge-warning";

  return <span className={`ui-badge ${className}`}>{label}</span>;
}

function ReviewCoverageCard({ comparisons }: { comparisons: ContentTypeComparison[] }) {
  return (
    <article className="ui-card p-5 shadow-card">
      <p className="ui-eyebrow">Review Coverage</p>
      <div className="mt-4 grid gap-4">
        {comparisons.map((comparison) => (
          <div key={comparison.type}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-ink">{comparison.label}</span>
              <span className="text-muted">{comparison.coveragePct}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-accent-300"
                style={{ width: `${comparison.coveragePct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted">
              {comparison.reviewed} reviewed · {comparison.pending} pending · {comparison.failed} failed
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function AttentionRequiredCard({ items }: { items: AttentionItem[] }) {
  return (
    <article className="ui-card p-5 shadow-card">
      <p className="ui-eyebrow">Needs Attention</p>
      {items.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-muted">No urgent review issues found.</p>
      ) : (
        <ol className={`mt-4 grid gap-3 overflow-y-auto pr-1 ${WIDGET_MAX_CONTENT_H}`}>
          {items.slice(0, 6).map((item) => (
            <li key={item.id} className="rounded-lg border border-line bg-white/[0.02] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted">{item.typeLabel}</p>
                  <Link
                    href={item.editHref}
                    className="mt-1 block font-medium text-ink hover:text-accent-200"
                  >
                    <ClampedText as="span" lines={PREVIEW_TITLE_LINES} className="block">
                      {item.title}
                    </ClampedText>
                  </Link>
                </div>
                <span className="ui-chip shrink-0 tabular-nums">
                  {item.score === null ? "-" : item.score}
                </span>
              </div>
              <ClampedText lines={PREVIEW_SUBTITLE_LINES} className="mt-2 text-sm leading-5 text-muted">
                {item.majorIssue}
              </ClampedText>
              {item.reasons.length > 0 ? (
                <ClampedText lines={1} className="mt-2 text-xs text-muted/70">
                  {item.reasons.join(" · ")}
                </ClampedText>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}

function FindingCard({
  title,
  description,
  findings,
  tone,
}: {
  title: string;
  description: string;
  findings: AggregatedFinding[];
  tone: "strength" | "issue";
}) {
  const maxCount = Math.max(1, ...findings.map((finding) => finding.count));

  return (
    <article className="ui-card p-5 shadow-card">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
      {findings.length === 0 ? (
        <p className="mt-5 text-sm text-muted">No completed review details yet.</p>
      ) : (
        <div className={`mt-5 grid gap-3 overflow-y-auto pr-1 ${WIDGET_MAX_CONTENT_H}`}>
          {findings.map((finding, index) => (
            <FindingDetails
              key={finding.label}
              finding={finding}
              maxCount={maxCount}
              color={tone === "strength" ? FINDING_COLORS[index % FINDING_COLORS.length]! : severityColor(finding.severity)}
            />
          ))}
        </div>
      )}
    </article>
  );
}

function FindingDetails({
  finding,
  maxCount,
  color,
}: {
  finding: AggregatedFinding;
  maxCount: number;
  color: string;
}) {
  return (
    <details className="group rounded-lg border border-line bg-white/[0.02] p-3">
      <summary className="cursor-pointer list-none">
        <div className="flex items-center justify-between gap-3 text-sm">
          <ClampedText as="span" lines={PREVIEW_SUBTITLE_LINES} className="min-w-0 font-medium text-ink">
            {finding.label}
          </ClampedText>
          <span className="shrink-0 text-muted tabular-nums">{finding.count}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.max(8, (finding.count / maxCount) * 100)}%`, backgroundColor: color }}
          />
        </div>
      </summary>
      <div className="mt-3 border-t border-line pt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Appears in</p>
        <ul className="mt-2 grid gap-1.5">
          {finding.records.map((record) => (
            <li key={record.id} className="text-sm">
              <Link href={record.editHref} className="text-muted transition hover:text-ink">
                {record.title} <span className="text-muted/60">· {record.typeLabel}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

function SuggestionsHeatmap({ findings }: { findings: AggregatedFinding[] }) {
  const maxCount = Math.max(1, ...findings.map((finding) => finding.count));

  return (
    <article className="ui-card p-5 shadow-card">
      <h3 className="text-base font-semibold text-ink">AI Suggestions Heatmap</h3>
      <p className="mt-1 text-sm leading-6 text-muted">
        Most repeated editorial suggestions, grouped for action planning.
      </p>
      {findings.length === 0 ? (
        <p className="mt-5 text-sm text-muted">No suggestions have been stored yet.</p>
      ) : (
        <div className={`mt-5 flex flex-wrap gap-2 overflow-y-auto pr-1 ${WIDGET_MAX_CONTENT_H}`}>
          {findings.map((finding, index) => (
            <details key={finding.label} className="group">
              <summary
                className="flex max-w-xs cursor-pointer list-none items-baseline gap-2 rounded-lg border border-line px-3 py-2 text-sm text-ink transition hover:border-accent-300/50"
                style={{
                  backgroundColor: heatColor(finding.count / maxCount, index),
                }}
              >
                <span className="break-anywhere font-medium">{finding.label}</span>
                <span className="shrink-0 text-xs text-muted">×{finding.count}</span>
              </summary>
              <div className="mt-2 w-72 rounded-lg border border-line bg-surface p-3 shadow-pop">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Affected records</p>
                <ul className="mt-2 grid gap-1.5">
                  {finding.records.map((record) => (
                    <li key={record.id} className="text-sm">
                      <Link href={record.editHref} className="text-muted transition hover:text-ink">
                        {record.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          ))}
        </div>
      )}
    </article>
  );
}

function QualityTrendCard({
  points,
  trendDelta,
}: {
  points: QualityTrendPoint[];
  trendDelta: number | null;
}) {
  return (
    <article className="ui-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-ink">Quality Trend</h3>
          <p className="mt-1 text-sm leading-6 text-muted">Average direction across the last 30 completed reviews.</p>
        </div>
        <TrendChip delta={trendDelta} />
      </div>
      {points.length < 2 ? (
        <p className="mt-6 text-sm text-muted">More completed reviews are needed to show a trend.</p>
      ) : (
        <TrendLine points={points} />
      )}
    </article>
  );
}

function TrendLine({ points }: { points: QualityTrendPoint[] }) {
  const width = 520;
  const height = 180;
  const padding = 18;
  const xStep = (width - padding * 2) / Math.max(1, points.length - 1);
  const coordinates = points.map((point, index) => {
    const x = padding + index * xStep;
    const y = padding + (100 - point.score) * ((height - padding * 2) / 100);
    return { x, y, point };
  });
  const d = coordinates
    .map((coordinate, index) => `${index === 0 ? "M" : "L"} ${coordinate.x} ${coordinate.y}`)
    .join(" ");

  return (
    <div className="mt-5 overflow-hidden rounded-lg border border-line bg-white/[0.02] p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full" role="img" aria-label="Quality score trend">
        <path d={`M ${padding} ${height - padding} H ${width - padding}`} stroke="rgba(255,255,255,0.18)" />
        <path d={d} fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
        {coordinates.map(({ x, y, point }) => (
          <circle key={`${point.reviewedAt.toISOString()}-${point.score}`} cx={x} cy={y} r="4" fill="#fbbf24" />
        ))}
      </svg>
      <div className="flex justify-between text-xs text-muted">
        <span>Older</span>
        <span>Latest</span>
      </div>
    </div>
  );
}

function ContentTypeComparisonCard({ comparisons }: { comparisons: ContentTypeComparison[] }) {
  const maxScore = Math.max(1, ...comparisons.map((comparison) => comparison.averageScore ?? 0));

  return (
    <article className="ui-card p-5 shadow-card">
      <h3 className="text-base font-semibold text-ink">Content Type Comparison</h3>
      <p className="mt-1 text-sm leading-6 text-muted">Quality, issue load, and suggestion volume by content type.</p>
      <div className="mt-5 grid gap-4">
        {comparisons.map((comparison) => (
          <div key={comparison.type}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-ink">{comparison.label}</span>
              <span className="tabular-nums text-muted">
                {comparison.averageScore === null ? "-" : `${comparison.averageScore}/100`}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-success-400"
                style={{ width: `${comparison.averageScore === null ? 0 : (comparison.averageScore / maxScore) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted">
              {comparison.reviewed} reviewed · {comparison.issueCount} issues · {comparison.suggestionCount} suggestions
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function severityColor(severity: AggregatedFinding["severity"]): string {
  if (severity === "high") return "#fb7185";
  if (severity === "medium") return "#fbbf24";
  return "#38bdf8";
}

function heatColor(intensity: number, index: number): string {
  const palette = [
    [56, 189, 248],
    [52, 211, 153],
    [251, 191, 36],
    [251, 113, 133],
    [167, 139, 250],
  ];
  const [r, g, b] = palette[index % palette.length]!;
  const alpha = 0.08 + Math.min(0.35, intensity * 0.32);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
