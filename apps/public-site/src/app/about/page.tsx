import type { Metadata } from "next";
import Link from "next/link";

import { getHomeContent } from "@portfolio/db/queries";

import { ContentCard } from "@/components/content-card";
import { PageHeader } from "@/components/page-header";
import { PrincipleCard, SectionHeader } from "@/components/portfolio-ui";
import { getComingSoonFallback } from "@/lib/coming-soon-gate";
import { getOperatingPrinciples, getRoleLabel, getSkillCategoryChips } from "@/lib/portfolio-content";

export const metadata: Metadata = {
  title: "About",
  description: "A concise, data-driven overview of engineering focus and operating principles.",
  alternates: {
    canonical: "/about",
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AboutPage() {
  const comingSoon = await getComingSoonFallback();

  if (comingSoon) {
    return comingSoon;
  }

  const content = await getHomeContent();
  const role = getRoleLabel(content.experiences);
  const chips = getSkillCategoryChips({
    skills: content.skills,
    lenses: content.lenses,
  });
  const principles = getOperatingPrinciples(content.principles);

  return (
    <>
      <PageHeader
        eyebrow="About"
        title={role || "A portfolio about how the work gets done."}
        description={content.experiences.find((experience) => experience.summary.trim())?.summary}
      />
      {chips.length > 0 ? (
        <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          <SectionHeader title="Focus Areas" />
          <ul className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <li
                key={chip}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-ink/90"
              >
                {chip}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {content.experiences.length > 0 ? (
        <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          <SectionHeader title="Recent Context" action={{ href: "/experience", label: "View experience" }} />
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
      {principles.length > 0 ? (
        <section className="border-y border-line bg-white/[0.025]">
          <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
            <SectionHeader title="Principles Preview" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {principles.map((principle, index) => (
                <PrincipleCard key={principle.id} principle={principle} index={index} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/how-i-work"
            className="inline-flex rounded-lg bg-gradient-to-r from-violet-500 to-sky-400 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Explore How I Work
          </Link>
          {content.caseStudies.length > 0 ? (
            <Link
              href="/case-studies"
              className="inline-flex rounded-lg border border-violet-400/70 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-violet-400/10"
            >
              View Case Studies
            </Link>
          ) : null}
        </div>
      </section>
    </>
  );
}
