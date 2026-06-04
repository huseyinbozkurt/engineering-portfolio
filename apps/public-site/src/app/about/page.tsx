import type { Metadata } from "next";
import Link from "next/link";

import { getHomeContent } from "@portfolio/db/queries";

import { ContentCard } from "@/components/content-card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionHeading } from "@/components/section-heading";

export const metadata: Metadata = {
  title: "About",
  description: "A concise, data-driven overview of engineering focus and operating principles.",
  alternates: {
    canonical: "/about",
  },
};

export const revalidate = 3600;

export default async function AboutPage() {
  const content = await getHomeContent();

  return (
    <>
      <PageHeader
        eyebrow="About"
        title="A portfolio about how the work gets done."
        description="This page becomes a concise career and operating overview as real experiences, principles, and case studies are added."
      />
      <section className="mx-auto max-w-7xl px-5 pb-16 lg:px-8">
        {content.experiences.length === 0 ? (
          <EmptyState
            title="Career summary coming soon"
            description="Experience records have not been added yet. The layout is ready to summarize real roles without turning the page into a resume dump."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {content.experiences.slice(0, 3).map((experience) => (
              <ContentCard
                key={experience.id}
                title={`${experience.role} at ${experience.company}`}
                description={experience.summary}
              />
            ))}
          </div>
        )}
      </section>
      <section className="border-y border-line bg-white/[0.025]">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
          <SectionHeading title="Principles Preview" />
          {content.principles.length === 0 ? (
            <EmptyState
              title="Operating principles coming soon"
              description="Principles will be listed here when real content is available."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {content.principles.slice(0, 4).map((principle) => (
                <ContentCard
                  key={principle.id}
                  title={principle.title}
                  description={principle.summary}
                />
              ))}
            </div>
          )}
          <Link
            href="/how-i-work"
            className="mt-8 inline-flex rounded-lg bg-teal-200 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-100"
          >
            Explore How I Work
          </Link>
        </div>
      </section>
    </>
  );
}
