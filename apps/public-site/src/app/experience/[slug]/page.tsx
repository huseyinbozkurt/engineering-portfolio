import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getExperienceBySlug,
  getPublishedExperiences,
} from "@portfolio/db/queries";

import { CaseStoryCard } from "@/components/case-story-card";
import { ContentCard } from "@/components/content-card";
import { RichText } from "@/components/rich-text";
import { SectionHeading } from "@/components/section-heading";
import { StatusPill } from "@/components/status-pill";
import { formatDateRange } from "@/lib/format";
import { getComingSoonFallback } from "@/lib/coming-soon-gate";
import { experienceHref, projectHref } from "@/lib/paths";
import { siteConfig } from "@/lib/site";

interface ExperienceDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 3600;

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const experiences = await getPublishedExperiences();
  return experiences.map((experience) => ({ slug: experience.slug || experience.id }));
}

export async function generateMetadata({
  params,
}: ExperienceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getExperienceBySlug(slug);

  if (!detail) {
    return {
      title: "Experience",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${detail.experience.role} at ${detail.experience.company}`;
  const description = detail.experience.seoDescription || detail.experience.summary || siteConfig.description;

  return {
    title: detail.experience.seoTitle || title,
    description,
    alternates: {
      canonical: experienceHref(detail.experience),
    },
    openGraph: {
      title,
      description,
      url: experienceHref(detail.experience),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

interface MetaItem {
  id: string;
  label: string;
  href?: string;
}

function MetaGroup({ title, items }: { title: string; items: MetaItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-amber-200">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) =>
          item.href ? (
            <Link
              key={item.id}
              href={item.href}
              className="rounded-lg border border-line bg-white/5 px-3 py-1 text-xs text-muted transition hover:border-teal-300/50 hover:text-ink"
            >
              {item.label}
            </Link>
          ) : (
            <StatusPill key={item.id} label={item.label} />
          ),
        )}
      </div>
    </div>
  );
}

export default async function ExperienceDetailPage({ params }: ExperienceDetailPageProps) {
  const comingSoon = await getComingSoonFallback();

  if (comingSoon) {
    return comingSoon;
  }

  const { slug } = await params;
  const detail = await getExperienceBySlug(slug);

  if (!detail) {
    notFound();
  }

  const { experience } = detail;
  const dateRange = formatDateRange(
    experience.startDate,
    experience.endDate,
    experience.isCurrent,
  );
  const hasSummary = experience.summary.trim().length > 0;
  const hasDetails = experience.details.trim().length > 0;
  const awardsRecognition = getAwardsRecognitionItems(experience.awards);
  const hasAwardsRecognition = awardsRecognition.length > 0;
  const hasMeta =
    detail.lenses.length > 0 ||
    detail.skills.length > 0 ||
    detail.principles.length > 0 ||
    detail.tags.length > 0;
  const hasSidebar = hasAwardsRecognition || hasMeta;

  return (
    <>
      <article className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
        <Link
          href="/experience"
          className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-ink"
        >
          <span aria-hidden>←</span> All experience
        </Link>

        <header className="mt-8">
          <p className="text-sm font-medium text-teal-200">Experience</p>
          <h1 className="mt-4 text-4xl font-semibold text-ink md:text-6xl">{experience.role}</h1>
          <p className="mt-3 text-xl text-muted">{experience.company}</p>
          {dateRange || experience.location ? (
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {dateRange ? <span className="text-amber-200">{dateRange}</span> : null}
              {dateRange && experience.location ? (
                <span className="text-muted/50" aria-hidden>
                  •
                </span>
              ) : null}
              {experience.location ? (
                <span className="text-muted">{experience.location}</span>
              ) : null}
            </div>
          ) : null}
        </header>

        {hasSummary || hasDetails || hasSidebar ? (
          <div
            className={
              hasSidebar ? "mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]" : "mt-10"
            }
          >
            <div className="grid min-w-0 gap-6">
              {hasSummary ? (
                <section className="glass-panel rounded-lg p-6 lg:p-8">
                  <h2 className="mb-5 text-2xl font-semibold text-ink">Summary</h2>
                  <RichText value={experience.summary} />
                </section>
              ) : null}
              {hasDetails ? (
                <section className="glass-panel rounded-lg p-6 lg:p-8">
                  <h2 className="mb-5 text-2xl font-semibold text-ink">Details</h2>
                  <RichText value={experience.details} />
                </section>
              ) : null}
            </div>

            {hasSidebar ? (
              <aside className="grid content-start gap-6">
                <AwardsRecognition items={awardsRecognition} />
                <MetaGroup
                  title="Lenses"
                  items={detail.lenses.map((lens) => ({
                    id: lens.id,
                    label: lens.name,
                    href: `/lenses/${lens.slug}`,
                  }))}
                />
                <MetaGroup
                  title="Skills"
                  items={detail.skills.map((skill) => ({ id: skill.id, label: skill.name }))}
                />
                <MetaGroup
                  title="Operating principles"
                  items={detail.principles.map((principle) => ({
                    id: principle.id,
                    label: principle.title,
                  }))}
                />
                <MetaGroup
                  title="Focus areas"
                  items={detail.tags.map((tag) => ({ id: tag.id, label: tag.name }))}
                />
              </aside>
            ) : null}
          </div>
        ) : null}
      </article>

      {detail.caseStudies.length > 0 ? (
        <section className="border-y border-line bg-white/[0.025]">
          <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
            <SectionHeading
              title="Case Story Highlights"
              description="Short problem-to-outcome summaries from related case studies. Open a case story for the full context, constraints, and trade-offs."
            />
            <div className="grid gap-4 lg:grid-cols-2">
              {detail.caseStudies.map((caseStudy) => (
                <CaseStoryCard key={caseStudy.id} caseStudy={caseStudy} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {detail.projects.length > 0 ? (
        <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
          <SectionHeading title="Related Projects" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {detail.projects.map((project) => (
              <ContentCard
                key={project.id}
                href={projectHref(project)}
                title={project.name}
                description={project.description}
                meta="Project"
              />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function AwardsRecognition({ items }: { items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="glass-panel rounded-lg p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-200">
        Awards &amp; Recognition
      </h2>
      <ol className="mt-4 grid gap-3">
        {items.map((item, index) => (
          <li key={`${index}-${item}`} className="flex gap-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-line bg-white/[0.04] text-xs font-semibold text-teal-200">
              {index + 1}
            </span>
            <p className="text-sm leading-6 text-muted">{item}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function getAwardsRecognitionItems(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim().replace(/^(?:[-*]|\d+[.)])\s+/, ""))
    .filter((item) => item.length > 0)
    .slice(0, 3);
}
