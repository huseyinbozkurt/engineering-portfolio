import type { Metadata } from "next";

import { getPublishedCaseStudies } from "@portfolio/db/queries";

import { PageHeader } from "@/components/page-header";
import { CaseStudyCard } from "@/components/portfolio-ui";
import { getComingSoonFallback } from "@/lib/coming-soon-gate";

export const metadata: Metadata = {
  title: "Case Studies",
  description: "Case studies covering context, constraints, trade-offs, outcomes, and lessons learned.",
  alternates: {
    canonical: "/case-studies",
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
        <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-16">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {caseStudies.map((caseStudy) => (
              <CaseStudyCard key={caseStudy.id} caseStudy={caseStudy} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
