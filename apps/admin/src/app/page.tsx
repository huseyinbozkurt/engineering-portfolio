import Link from "next/link";

import { getAdminContentIndex, getContactSubmissions, hasDatabaseUrl } from "@portfolio/db";

import { EmptyPanel } from "@/components/empty-panel";
import { LlmStatusPanel } from "@/components/llm-status-panel";
import { PageTitle } from "@/components/page-title";
import { getLlmConnectionStatuses } from "@/lib/llm-config";
import { adminNavItems } from "@/lib/admin-nav";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [content, contactSubmissions, llmStatuses] = await Promise.all([
    getAdminContentIndex(),
    getContactSubmissions(),
    getLlmConnectionStatuses(),
  ]);
  const metrics = [
    { label: "Lenses", value: content.lenses.length },
    { label: "Principles", value: content.principles.length },
    { label: "Decision Patterns", value: content.decisionPatterns.length },
    { label: "Projects", value: content.projects.length },
    { label: "Case Studies", value: content.caseStudies.length },
    { label: "Skills", value: content.skills.length },
    { label: "Tags", value: content.tags.length },
    { label: "Contact", value: contactSubmissions.length },
  ];

  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title="Content Overview"
        description="Manage the portfolio as structured content. Published content can render in the public site; drafts stay private to this app."
      />
      {!hasDatabaseUrl() ? (
        <div className="mb-8">
          <EmptyPanel
            title="DATABASE_URL is not configured"
            description="The admin can render, but create actions need a PostgreSQL connection string."
          />
        </div>
      ) : null}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border border-line bg-white/[0.03] p-5">
            <p className="text-3xl font-semibold text-ink">{metric.value}</p>
            <p className="mt-2 text-sm text-muted">{metric.label}</p>
          </div>
        ))}
      </section>
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-ink">Content Areas</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {adminNavItems.slice(1).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border border-line bg-white/[0.03] p-4 text-sm font-medium text-ink transition hover:border-teal-300/50 hover:bg-white/[0.06]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>
      <LlmStatusPanel statuses={llmStatuses} />
    </main>
  );
}
