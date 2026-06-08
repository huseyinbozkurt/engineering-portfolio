import type { Metadata } from "next";
import Link from "next/link";

import type { ExperienceRecord } from "@portfolio/db/queries";
import { getPublishedExperiences } from "@portfolio/db/queries";

import { PageHeader } from "@/components/page-header";
import { SectionHeader, Timeline } from "@/components/portfolio-ui";
import { RichText } from "@/components/rich-text";
import { formatDateRange } from "@/lib/format";
import { getComingSoonFallback } from "@/lib/coming-soon-gate";
import { experienceHref } from "@/lib/paths";

export const metadata: Metadata = {
  title: "Experience",
  description: "Professional experience connected to engineering lenses, principles, and case studies.",
  alternates: {
    canonical: "/experience",
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ExperiencePage() {
  const comingSoon = await getComingSoonFallback();

  if (comingSoon) {
    return comingSoon;
  }

  const experiences = await getPublishedExperiences();

  return (
    <>
      <PageHeader
        eyebrow="Experience"
        title="Experience as context, not a resume dump."
        description=""
      />
      {experiences.length > 0 ? (
        <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-16">
          <SectionHeader title="Timeline" />
          <Timeline experiences={experiences} />
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {experiences.map((experience) => (
              <ExperienceCard key={experience.id} experience={experience} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function ExperienceCard({ experience }: { experience: ExperienceRecord }) {
  const dateRange = formatDateRange(
    experience.startDate,
    experience.endDate,
    experience.isCurrent,
  );

  return (
    <Link
      href={experienceHref(experience)}
      className="glass-panel block rounded-lg p-6 transition hover:border-violet-300/40 hover:bg-white/[0.07]"
    >
      <div className="flex flex-wrap items-center gap-3">
        {dateRange ? (
          <p className="text-sm font-semibold text-violet-200">{dateRange}</p>
        ) : null}
        {experience.isCurrent ? (
          <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2.5 py-1 text-xs font-medium text-emerald-200">
            Current
          </span>
        ) : null}
      </div>
      <h2 className="mt-4 text-2xl font-semibold text-ink">
        {experience.role} at {experience.company}
      </h2>
      {experience.location ? <p className="mt-2 text-sm text-muted">{experience.location}</p> : null}
      {experience.summary.trim() ? (
        <div className="mt-5">
          <RichText value={experience.summary} />
        </div>
      ) : null}
    </Link>
  );
}
