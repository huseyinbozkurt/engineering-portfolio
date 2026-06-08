import { ChevronRight } from "lucide-react";
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
  const metrics = [
    { label: "Lenses", value: content.lenses.length },
    { label: "Principles", value: content.principles.length },
    { label: "Decision Patterns", value: content.decisionPatterns.length },
    { label: "Projects", value: content.projects.length },
    { label: "Case Studies", value: content.caseStudies.length },
    { label: "Skills", value: content.skills.length },
    { label: "Tags", value: content.tags.length },
    { label: "AI Stories", value: aiStories.length },
    { label: "Contact", value: contactSubmissions.length },
  ];

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
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="ui-card p-5 shadow-card transition hover:border-line-strong hover:bg-white/[0.035]"
          >
            <p className="text-3xl font-semibold tracking-tight text-ink tabular-nums">
              {metric.value}
            </p>
            <p className="mt-1.5 text-sm text-muted">{metric.label}</p>
          </div>
        ))}
      </section>
      <section className="mt-10">
        <h2 className="mb-4 text-base font-semibold text-ink">Content Areas</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {adminNavItems.slice(1).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-2xl border border-line bg-white/[0.02] p-4 text-sm font-medium text-ink transition hover:border-teal-300/40 hover:bg-white/[0.05]"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-line bg-teal-300/10 text-teal-200">
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

async function readAiStories() {
  try {
    return await getAiGeneratedStories();
  } catch {
    return [];
  }
}
