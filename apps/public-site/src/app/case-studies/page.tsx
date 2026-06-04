import type { Metadata } from "next";

import { getPublishedCaseStudies } from "@portfolio/db/queries";

import { ContentCard } from "@/components/content-card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Case Studies",
  description: "Case studies covering context, constraints, trade-offs, outcomes, and lessons learned.",
  alternates: {
    canonical: "/case-studies",
  },
};

export const revalidate = 3600;

export default async function CaseStudiesPage() {
  const caseStudies = await getPublishedCaseStudies();

  return (
    <>
      <PageHeader
        eyebrow="Case Studies"
        title="The decisions behind the outcomes."
        description="Each case study is structured around context, problem, constraints, action, trade-offs, outcome, and learning."
      />
      <section className="mx-auto max-w-7xl px-5 pb-16 lg:px-8">
        {caseStudies.length === 0 ? (
          <EmptyState
            title="Case studies are currently being prepared"
            description="Published case studies will appear here when real content is ready."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {caseStudies.map((caseStudy) => (
              <ContentCard
                key={caseStudy.id}
                href={`/case-studies/${caseStudy.slug}`}
                title={caseStudy.title}
                description={caseStudy.excerpt}
                meta="Case study"
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
