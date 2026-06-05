import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getProjectBySlug, getPublishedProjects } from "@portfolio/db/queries";

import { ContentCard } from "@/components/content-card";
import { RichText } from "@/components/rich-text";
import { SectionHeading } from "@/components/section-heading";
import { StatusPill } from "@/components/status-pill";
import { getComingSoonFallback } from "@/lib/coming-soon-gate";
import { experienceHref, projectHref } from "@/lib/paths";
import { siteConfig } from "@/lib/site";

interface ProjectDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 3600;

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const projects = await getPublishedProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: ProjectDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getProjectBySlug(slug);

  if (!detail) {
    return {
      title: "Project",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description =
    detail.project.seoDescription || detail.project.description || siteConfig.description;

  return {
    title: detail.project.seoTitle || detail.project.name,
    description,
    alternates: {
      canonical: projectHref(detail.project),
    },
    openGraph: {
      title: detail.project.name,
      description,
      url: projectHref(detail.project),
    },
    twitter: {
      card: "summary_large_image",
      title: detail.project.name,
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

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const comingSoon = await getComingSoonFallback();

  if (comingSoon) {
    return comingSoon;
  }

  const { slug } = await params;
  const detail = await getProjectBySlug(slug);

  if (!detail) {
    notFound();
  }

  const { project } = detail;
  const hasDescription = project.description.trim().length > 0;
  const hasDetails = project.details.trim().length > 0;
  const hasMeta =
    Boolean(detail.experience) ||
    detail.lenses.length > 0 ||
    detail.skills.length > 0 ||
    detail.principles.length > 0 ||
    detail.tags.length > 0;
  const hasLinks = Boolean(project.url || project.githubUrl);

  return (
    <>
      <article className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-ink"
        >
          <span aria-hidden>←</span> All projects
        </Link>

        <header className="mt-8">
          <p className="text-sm font-medium text-teal-200">Project</p>
          <h1 className="mt-4 text-4xl font-semibold text-ink md:text-6xl">{project.name}</h1>
          {detail.experience ? (
            <p className="mt-3 text-sm text-muted">
              Built during{" "}
              <Link
                href={experienceHref(detail.experience)}
                className="text-amber-200 underline-offset-4 transition hover:underline"
              >
                {detail.experience.role} at {detail.experience.company}
              </Link>
            </p>
          ) : null}
          {hasLinks ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {project.url ? (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-teal-200 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-teal-100"
                >
                  Visit project ↗
                </a>
              ) : null}
              {project.githubUrl ? (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-teal-300/50 hover:bg-white/[0.06]"
                >
                  View source ↗
                </a>
              ) : null}
            </div>
          ) : null}
        </header>

        {hasDescription || hasDetails || hasMeta ? (
          <div
            className={
              hasMeta ? "mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]" : "mt-10"
            }
          >
            <div className="grid min-w-0 gap-6">
              {hasDescription ? (
                <section className="glass-panel rounded-lg p-6 lg:p-8">
                  <h2 className="mb-5 text-2xl font-semibold text-ink">Overview</h2>
                  <RichText value={project.description} />
                </section>
              ) : null}
              {hasDetails ? (
                <section className="glass-panel rounded-lg p-6 lg:p-8">
                  <h2 className="mb-5 text-2xl font-semibold text-ink">Details</h2>
                  <RichText value={project.details} />
                </section>
              ) : null}
            </div>

            {hasMeta ? (
              <aside className="grid content-start gap-6">
                <MetaGroup
                  title="Position"
                  items={
                    detail.experience
                      ? [
                          {
                            id: detail.experience.id,
                            label: `${detail.experience.role} at ${detail.experience.company}`,
                            href: experienceHref(detail.experience),
                          },
                        ]
                      : []
                  }
                />
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
            <SectionHeading title="Related Case Studies" />
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
          </div>
        </section>
      ) : null}
    </>
  );
}
