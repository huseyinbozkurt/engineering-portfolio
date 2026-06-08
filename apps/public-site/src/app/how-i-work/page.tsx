import type { Metadata } from "next";

import { getPublishedDecisionPatterns, getPublishedPrinciples } from "@portfolio/db/queries";

import { ContentCard } from "@/components/content-card";
import { PageHeader } from "@/components/page-header";
import { PrincipleCard, SectionHeader } from "@/components/portfolio-ui";
import { getComingSoonFallback } from "@/lib/coming-soon-gate";

export const metadata: Metadata = {
  title: "How I Work",
  description: "Operating principles and decision patterns behind the engineering work.",
  alternates: {
    canonical: "/how-i-work",
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HowIWorkPage() {
  const comingSoon = await getComingSoonFallback();

  if (comingSoon) {
    return comingSoon;
  }

  const [principles, decisionPatterns] = await Promise.all([
    getPublishedPrinciples(),
    getPublishedDecisionPatterns(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="How I Work"
        title="Principles first. Decisions in context."
        description=""
      />
      {principles.length > 0 ? (
        <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-16">
          <SectionHeader title="Operating Principles" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {principles.map((principle, index) => (
              <PrincipleCard key={principle.id} principle={principle} index={index} />
            ))}
          </div>
        </section>
      ) : null}
      {decisionPatterns.length > 0 ? (
        <section className="border-y border-line bg-white/[0.025]">
          <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
            <SectionHeader title="Decision Patterns" />
            <div className="grid gap-4 md:grid-cols-2">
              {decisionPatterns.map((pattern) => (
                <ContentCard
                  key={pattern.id}
                  title={pattern.title}
                  description={pattern.summary}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
