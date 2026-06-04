import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCaseStudyBySlug, getPublishedCaseStudies } from "@portfolio/db/queries";

import { RichText } from "@/components/rich-text";
import { StatusPill } from "@/components/status-pill";
import { siteConfig } from "@/lib/site";

interface CaseStudyPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 3600;

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const caseStudies = await getPublishedCaseStudies();
  return caseStudies.map((caseStudy) => ({ slug: caseStudy.slug }));
}

export async function generateMetadata({ params }: CaseStudyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getCaseStudyBySlug(slug);

  if (!detail) {
    return {
      title: "Case Study",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: detail.caseStudy.title,
    description: detail.caseStudy.excerpt || siteConfig.description,
    alternates: {
      canonical: `/case-studies/${detail.caseStudy.slug}`,
    },
    openGraph: {
      title: detail.caseStudy.title,
      description: detail.caseStudy.excerpt || siteConfig.description,
      url: `/case-studies/${detail.caseStudy.slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: detail.caseStudy.title,
      description: detail.caseStudy.excerpt || siteConfig.description,
    },
  };
}

export default async function CaseStudyPage({ params }: CaseStudyPageProps) {
  const { slug } = await params;
  const detail = await getCaseStudyBySlug(slug);

  if (!detail) {
    notFound();
  }

  const sections: CaseStudySection[] = [
    { title: "Context", value: detail.caseStudy.context, accent: "text-teal-200" },
    { title: "Problem", value: detail.caseStudy.problem, accent: "text-rose-200" },
    { title: "Constraints", value: detail.caseStudy.constraints, accent: "text-amber-200" },
    { title: "What I Did", value: detail.caseStudy.action, accent: "text-teal-200" },
    { title: "Trade-offs", value: detail.caseStudy.tradeoffs, accent: "text-amber-200" },
    { title: "Outcome", value: detail.caseStudy.outcome, accent: "text-teal-100" },
    { title: "What I Learned", value: detail.caseStudy.learning, accent: "text-sky-200" },
  ];

  return (
    <article className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-5 lg:h-[calc(100vh-4.5rem)] lg:min-h-[calc(100vh-4.5rem)] lg:px-8">
      <header className="grid shrink-0 gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="glass-panel rounded-lg p-4">
          <p className="text-sm font-medium text-teal-200">Case study</p>
          <h1 className="mt-2 max-w-4xl text-3xl font-semibold text-ink md:text-4xl">
            {detail.caseStudy.title}
          </h1>
          {detail.caseStudy.excerpt ? (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
              {detail.caseStudy.excerpt}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {detail.lenses.map((lens) => (
              <StatusPill key={lens.id} label={lens.name} />
            ))}
            {detail.principles.map((principle) => (
              <StatusPill key={principle.id} label={principle.title} />
            ))}
          </div>
        </div>

        <aside className="glass-panel rounded-lg p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-200">Case map</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Metric label="Sections" value={sections.length} />
            <Metric label="Signals" value={detail.lenses.length + detail.principles.length} />
            <Metric label="Skills" value={detail.skills.length} />
            <Metric label="Projects" value={detail.projects.length} />
          </div>
        </aside>
      </header>

      <div className="mt-3 grid min-h-0 flex-1 gap-3 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="glass-panel min-h-0 rounded-lg p-3 lg:overflow-y-auto">
          <h2 className="text-sm font-semibold text-ink">Story flow</h2>
          <ol className="mt-3 grid gap-1">
            {sections.map((section, index) => (
              <li key={section.title} className="flex items-center gap-2 rounded-lg bg-white/[0.035] p-1.5">
                <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border border-line bg-white/[0.04] text-xs font-semibold ${section.accent}`}>
                  {index + 1}
                </span>
                <span className="text-xs text-muted">{section.title}</span>
              </li>
            ))}
          </ol>
        </aside>

        <div className="grid min-h-0 gap-3 lg:grid-cols-3 lg:grid-rows-[repeat(3,minmax(0,1fr))] lg:overflow-hidden xl:grid-cols-4 xl:grid-rows-[repeat(2,minmax(0,1fr))]">
          {sections.map((section, index) => (
            <CaseStudySectionCard
              key={section.title}
              section={section}
              index={index}
              highlight={section.title === "Problem" || section.title === "Outcome"}
            />
          ))}
        </div>
      </div>
    </article>
  );
}

interface CaseStudySection {
  title: string;
  value: string;
  accent: string;
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-white/[0.035] p-2.5">
      <p className="text-xl font-semibold text-ink">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

function CaseStudySectionCard({
  section,
  index,
  highlight,
}: {
  section: CaseStudySection;
  index: number;
  highlight: boolean;
}) {
  return (
    <section
      className={
        highlight
          ? "glass-panel flex min-h-44 flex-col rounded-lg border-teal-300/30 p-3 lg:min-h-0"
          : "glass-panel flex min-h-44 flex-col rounded-lg p-3 lg:min-h-0"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">{section.title}</h2>
        <span className={`text-xs font-semibold ${section.accent}`}>
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1 [&_.rich-text]:gap-2 [&_.rich-text]:text-sm [&_.rich-text]:leading-6">
        {section.value.trim() ? (
          <RichText value={section.value} />
        ) : (
          <p className="text-sm leading-6 text-muted">Section content coming soon.</p>
        )}
      </div>
    </section>
  );
}
