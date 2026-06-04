import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getExperienceBySlug,
  getPublishedExperiences,
} from "@portfolio/db/queries";

import { ContentCard } from "@/components/content-card";
import { EmptyState } from "@/components/empty-state";
import { RichText } from "@/components/rich-text";
import { SectionHeading } from "@/components/section-heading";
import { StatusPill } from "@/components/status-pill";
import { formatDateRange } from "@/lib/format";
import { experienceHref } from "@/lib/paths";
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

export default async function ExperienceDetailPage({ params }: ExperienceDetailPageProps) {
  const { slug } = await params;
  const detail = await getExperienceBySlug(slug);

  if (!detail) {
    notFound();
  }

  const dateRange = formatDateRange(
    detail.experience.startDate,
    detail.experience.endDate,
    detail.experience.isCurrent,
  );

  return (
    <>
      <article>
        <header className="mx-auto max-w-5xl px-5 py-16 lg:px-8 lg:py-24">
          <p className="mb-5 text-sm font-medium text-teal-200">Experience</p>
          <h1 className="text-4xl font-semibold text-ink md:text-6xl">
            {detail.experience.role} at {detail.experience.company}
          </h1>
          <p className="mt-5 text-sm text-amber-200">{dateRange}</p>
          {detail.experience.location ? (
            <p className="mt-3 text-sm text-muted">{detail.experience.location}</p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-2">
            {detail.lenses.map((lens) => (
              <StatusPill key={lens.id} label={lens.name} />
            ))}
            {detail.principles.map((principle) => (
              <StatusPill key={principle.id} label={principle.title} />
            ))}
            {detail.skills.map((skill) => (
              <StatusPill key={skill.id} label={skill.name} />
            ))}
          </div>
        </header>
        <div className="mx-auto max-w-5xl px-5 pb-16 lg:px-8">
          <section className="glass-panel rounded-lg p-6">
            <h2 className="mb-5 text-2xl font-semibold text-ink">Summary</h2>
            {detail.experience.summary.trim() ? (
              <RichText value={detail.experience.summary} />
            ) : (
              <p className="text-sm leading-6 text-muted">Experience summary coming soon.</p>
            )}
          </section>
        </div>
      </article>

      <section className="border-y border-line bg-white/[0.025]">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
          <SectionHeading title="Related Case Studies" />
          {detail.caseStudies.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {detail.caseStudies.map((caseStudy) => (
                <ContentCard
                  key={caseStudy.id}
                  href={`/case-studies/${caseStudy.slug}`}
                  title={caseStudy.title}
                  description={caseStudy.excerpt}
                  meta="Case study"
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Related case studies coming soon"
              description="Published case studies connected to this experience will appear here."
            />
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <SectionHeading title="Related Projects" />
        {detail.projects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {detail.projects.map((project) => (
              <ContentCard
                key={project.id}
                href={project.url ?? project.githubUrl ?? "/projects"}
                title={project.name}
                description={project.description}
                meta="Project"
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Related projects coming soon"
            description="Projects connected through case studies will appear here."
          />
        )}
      </section>
    </>
  );
}
