import {
  Aperture,
  BookOpen,
  ChevronRight,
  Compass,
  FileText,
  FolderKanban,
  GitBranch,
  Mail,
  Tag,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { getAdminContentIndex, getContactSubmissions, hasDatabaseUrl } from "@portfolio/db";
import { getAiGeneratedStories } from "@portfolio/db/ai-stories";

import { CreateWithAiModal } from "@/components/create-with-ai-modal";
import { EmptyPanel } from "@/components/empty-panel";
import { LlmStatusPanel } from "@/components/llm-status-panel";
import { PageTitle } from "@/components/page-title";
import { getLlmConnectionStatuses } from "@/lib/llm-config";
import { adminNavItems } from "@/lib/admin-nav";

export const dynamic = "force-dynamic";

interface Metric {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
}

/** A cohesive cool-toned palette (with two warm accents) for the chart widgets. */
const SEGMENT_COLORS = [
  "#8b5cf6",
  "#a78bfa",
  "#6366f1",
  "#38bdf8",
  "#22d3ee",
  "#2dd4bf",
  "#34d399",
  "#fbbf24",
  "#fb7185",
];

export default async function AdminHomePage() {
  const [content, contactSubmissions, llmStatuses, aiStories] = await Promise.all([
    getAdminContentIndex(),
    getContactSubmissions(),
    getLlmConnectionStatuses(),
    readAiStories(),
  ]);
  const onlineLlmCount = llmStatuses.filter((status) => status.status === "online").length;
  const createWithAiDisabledReason =
    onlineLlmCount === 0
      ? "No LLM connection is online. Configure a reachable provider before creating AI stories."
      : null;
  const metrics: Metric[] = [
    { label: "Lenses", value: content.lenses.length, icon: Aperture },
    { label: "Principles", value: content.principles.length, icon: Compass },
    { label: "Decision Patterns", value: content.decisionPatterns.length, icon: GitBranch },
    { label: "Projects", value: content.projects.length, icon: FolderKanban },
    { label: "Case Studies", value: content.caseStudies.length, icon: FileText },
    { label: "Skills", value: content.skills.length, icon: Wrench },
    { label: "Tags", value: content.tags.length, icon: Tag },
    { label: "AI Stories", value: aiStories.length, icon: BookOpen },
    { label: "Contact", value: contactSubmissions.length, icon: Mail },
  ].map((metric, index) => ({ ...metric, color: SEGMENT_COLORS[index % SEGMENT_COLORS.length]! }));

  const totalRecords = metrics.reduce((sum, metric) => sum + metric.value, 0);
  const distribution = metrics.filter((metric) => metric.value > 0);
  const topAreas = [...metrics].filter((m) => m.value > 0).sort((a, b) => b.value - a.value).slice(0, 6);
  const maxValue = Math.max(1, ...topAreas.map((metric) => metric.value));

  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title="Content Overview"
        description="Manage the portfolio as structured content. Published content can render in the public site; drafts stay private to this app."
        actions={
          <>
            <CreateWithAiModal
              canCreate={onlineLlmCount > 0}
              disabledReason={createWithAiDisabledReason}
            />
            <Link className="ui-btn-secondary" href="/ai-stories">
              Review AI stories
            </Link>
          </>
        }
      />
      {!hasDatabaseUrl() ? (
        <div className="mb-8">
          <EmptyPanel
            title="DATABASE_URL is not configured"
            description="The admin can render, but create actions need a PostgreSQL connection string."
          />
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="ui-card ui-card-hover p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-3xl font-semibold tracking-tight text-ink tabular-nums">
                    {metric.value}
                  </p>
                  <p className="mt-1.5 text-sm text-muted">{metric.label}</p>
                </div>
                <span className="ui-icon-tile">
                  <Icon className="size-5" aria-hidden />
                </span>
              </div>
            </div>
          );
        })}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="ui-card p-6 shadow-card">
          <h2 className="ui-section-title">Content mix</h2>
          <p className="mt-1 text-sm text-muted">Distribution of structured records by type.</p>
          {totalRecords === 0 ? (
            <p className="mt-6 text-sm text-muted">No content yet.</p>
          ) : (
            <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-5">
              <DonutChart segments={distribution} total={totalRecords} />
              <ul className="grid flex-1 gap-1.5">
                {distribution.map((metric) => (
                  <li key={metric.label} className="flex items-center gap-2.5 text-sm">
                    <span
                      aria-hidden
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: metric.color }}
                    />
                    <span className="flex-1 truncate text-muted">{metric.label}</span>
                    <span className="tabular-nums font-medium text-ink">{metric.value}</span>
                    <span className="w-10 text-right tabular-nums text-xs text-muted/70">
                      {Math.round((metric.value / totalRecords) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="ui-card p-6 shadow-card">
          <h2 className="ui-section-title">Largest content areas</h2>
          <p className="mt-1 text-sm text-muted">Areas ranked by number of records.</p>
          {topAreas.length === 0 ? (
            <p className="mt-6 text-sm text-muted">No content yet.</p>
          ) : (
            <div className="mt-5 grid gap-3.5">
              {topAreas.map((metric) => (
                <div key={metric.label}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-ink">{metric.label}</span>
                    <span className="tabular-nums text-muted">{metric.value}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(4, (metric.value / maxValue) * 100)}%`,
                        backgroundColor: metric.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="ui-section-title mb-4">Content areas</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {adminNavItems.slice(1).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-2xl border border-line bg-white/[0.02] p-4 text-sm font-medium text-ink transition duration-150 ease-ui hover:border-accent-400/40 hover:bg-white/[0.05]"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-accent-400/20 bg-accent-500/10 text-accent-200">
                  <Icon className="size-4" />
                </span>
                <span className="flex-1">{item.label}</span>
                <ChevronRight className="size-4 text-muted/40 transition group-hover:translate-x-0.5 group-hover:text-ink" />
              </Link>
            );
          })}
        </div>
      </section>

      <LlmStatusPanel statuses={llmStatuses} />
    </main>
  );
}

/** Pure-SVG donut built from already-fetched counts (no client JS, no new data). */
function DonutChart({
  segments,
  total,
}: {
  segments: Array<{ label: string; value: number; color: string }>;
  total: number;
}) {
  let cumulative = 0;

  return (
    <div className="relative size-40 shrink-0">
      <svg viewBox="0 0 36 36" className="size-40 -rotate-90">
        <circle
          cx="18"
          cy="18"
          r="15.915"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="4"
        />
        {segments.map((segment) => {
          const pct = (segment.value / total) * 100;
          const dash = `${pct} ${100 - pct}`;
          const offset = -cumulative;
          cumulative += pct;
          return (
            <circle
              key={segment.label}
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke={segment.color}
              strokeWidth="4"
              pathLength={100}
              strokeDasharray={dash}
              strokeDashoffset={offset}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tabular-nums text-ink">{total}</span>
        <span className="text-eyebrow font-semibold uppercase text-muted/60">Total</span>
      </div>
    </div>
  );
}

async function readAiStories() {
  try {
    return await getAiGeneratedStories();
  } catch {
    return [];
  }
}
