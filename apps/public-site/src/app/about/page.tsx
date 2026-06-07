import type { Metadata } from "next";
import Link from "next/link";

import { getHomeContent } from "@portfolio/db/queries";

import { ContentCard } from "@/components/content-card";
import { PageHeader } from "@/components/page-header";
import { SectionHeading } from "@/components/section-heading";
import { getComingSoonFallback } from "@/lib/coming-soon-gate";

export const metadata: Metadata = {
  title: "About",
  description: "A concise, data-driven overview of engineering focus and operating principles.",
  alternates: {
    canonical: "/about",
  },
};

export const revalidate = 3600;

export default async function AboutPage() {
  const comingSoon = await getComingSoonFallback();

  if (comingSoon) {
    return comingSoon;
  }

  const content = await getHomeContent();

  return (
    <>
      <PageHeader
        eyebrow="About"
        title="A portfolio about how the work gets done."
        description=""
      />
      {content.experiences.length > 0 ? (
        <section className="mx-auto max-w-7xl px-5 pb-16 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {content.experiences.slice(0, 3).map((experience) => (
              <ContentCard
                key={experience.id}
                title={`${experience.role} at ${experience.company}`}
                description={experience.summary}
              />
            ))}
          </div>
        </section>
      ) : null}
      <section className="border-y border-line bg-white/[0.025]">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
          {content.principles.length > 0 ? (
            <>
              <SectionHeading title="Principles Preview" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {content.principles.slice(0, 4).map((principle) => (
                  <ContentCard
                    key={principle.id}
                    title={principle.title}
                    description={principle.summary}
                  />
                ))}
              </div>
            </>
          ) : null}
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
