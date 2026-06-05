import type { Metadata } from "next";

import { getPublishedCaseStudies } from "@portfolio/db/queries";

import { ContentCard } from "@/components/content-card";
import { PageHeader } from "@/components/page-header";
import { getComingSoonFallback } from "@/lib/coming-soon-gate";

export const metadata: Metadata = {
  title: "Case Studies",
  description: "Case studies covering context, constraints, trade-offs, outcomes, and lessons learned.",
  alternates: {
    canonical: "/case-studies",
  },
};

export const revalidate = 3600;

export default async function CaseStudiesPage() {
  const comingSoon = await getComingSoonFallback();

  if (comingSoon) {
    return comingSoon;
  }

  const caseStudies = await getPublishedCaseStudies();

  return (
    <>
      <PageHeader
        eyebrow="Case Studies"
        title="The decisions behind the outcomes."
        description="Each case study is structured around context, problem, constraints, action, trade-offs, outcome, and learning."
      />
      {caseStudies.length > 0 ? (
        <section className="mx-auto max-w-7xl px-5 pb-16 lg:px-8">
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
        </section>
      ) : null}
    </>
  );
}
