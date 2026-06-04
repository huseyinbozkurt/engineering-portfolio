import type { Metadata } from "next";

import { getPublishedDecisionPatterns, getPublishedPrinciples } from "@portfolio/db/queries";

import { ContentCard } from "@/components/content-card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionHeading } from "@/components/section-heading";

export const metadata: Metadata = {
  title: "How I Work",
  description: "Operating principles and decision patterns behind the engineering work.",
  alternates: {
    canonical: "/how-i-work",
  },
};

export const revalidate = 3600;

export default async function HowIWorkPage() {
  const [principles, decisionPatterns] = await Promise.all([
    getPublishedPrinciples(),
    getPublishedDecisionPatterns(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="How I Work"
        title="Principles first. Decisions in context."
        description="This page shows how problems are approached, which trade-offs matter, and how operating principles connect to real work."
      />
      <section className="mx-auto max-w-7xl px-5 pb-14 lg:px-8">
        <SectionHeading title="Operating Principles" />
        {principles.length === 0 ? (
          <EmptyState
            title="Operating principles coming soon"
            description="Principles are fully data-driven and will appear here once authored."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {principles.map((principle) => (
              <ContentCard
                key={principle.id}
                title={principle.title}
                description={principle.summary}
              />
            ))}
          </div>
        )}
      </section>
      <section className="border-y border-line bg-white/[0.025]">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
          <SectionHeading title="Decision Patterns" />
          {decisionPatterns.length === 0 ? (
            <EmptyState
              title="Decision patterns coming soon"
              description="Decision patterns will be managed as content and connected to operating principles."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {decisionPatterns.map((pattern) => (
                <ContentCard
                  key={pattern.id}
                  title={pattern.title}
                  description={pattern.summary}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
