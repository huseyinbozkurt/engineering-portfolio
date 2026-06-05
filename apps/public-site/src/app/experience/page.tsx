import type { Metadata } from "next";
import Link from "next/link";

import { getPublishedExperiences } from "@portfolio/db/queries";

import { PageHeader } from "@/components/page-header";
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

export const revalidate = 3600;

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
        description="Roles are connected to the principles, lenses, skills, and case studies that explain how decisions were made."
      />
      {experiences.length > 0 ? (
        <section className="mx-auto max-w-5xl px-5 pb-16 lg:px-8">
          <div className="grid gap-5">
            {experiences.map((experience) => {
              const dateRange = formatDateRange(
                experience.startDate,
                experience.endDate,
                experience.isCurrent,
              );

              return (
                <Link
                  key={experience.id}
                  href={experienceHref(experience)}
                  className="glass-panel block rounded-lg p-6 transition hover:border-teal-300/40 hover:bg-white/8"
                >
                  {dateRange ? <p className="text-sm text-amber-200">{dateRange}</p> : null}
                  <h2 className="mt-3 text-2xl font-semibold text-ink">
                    {experience.role} at {experience.company}
                  </h2>
                  {experience.location ? (
                    <p className="mt-2 text-sm text-muted">{experience.location}</p>
                  ) : null}
                  {experience.summary.trim() ? (
                    <div className="mt-5">
                      <RichText value={experience.summary} />
                    </div>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </>
  );
}
