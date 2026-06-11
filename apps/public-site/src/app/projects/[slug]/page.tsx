import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getProjectBySlug } from "@portfolio/db/queries";

import { CaseStoryCard } from "@/components/case-story-card";
import { RichText } from "@/components/rich-text";
import { SectionHeading } from "@/components/section-heading";
import { StatusPill } from "@/components/status-pill";
import { getComingSoonFallback } from "@/lib/coming-soon-gate";
import { formatDateRange } from "@/lib/format";
import { experienceHref, projectHref } from "@/lib/paths";
import { siteConfig } from "@/lib/site";

interface ProjectDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

interface ArchitectureStackBox {
  title: string;
  value: string;
}

function MetaGroup({ title, items }: { title: string; items: MetaItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-violet-300">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) =>
          item.href ? (
            <Link
              key={item.id}
              href={item.href}
              className="rounded-lg border border-line bg-white/5 px-3 py-1 text-xs text-muted transition hover:border-violet-300/50 hover:text-ink"
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
  const architectureStackBoxes: ArchitectureStackBox[] = [
    { title: "Development Tech Stack", value: project.developmentTechStack },
    { title: "Q&A Tech Stack", value: project.qaTechStack },
    { title: "AI Integration Tech Stack", value: project.aiIntegrationTechStack },
    { title: "Deployment Tech Stack", value: project.deploymentTechStack },
  ].filter((box) => box.value.trim().length > 0);
  const hasArchitecture =
    project.architecture.trim().length > 0 || architectureStackBoxes.length > 0;
  const hasMeta =
    Boolean(detail.experience) ||
    detail.lenses.length > 0 ||
    detail.skills.length > 0 ||
    detail.principles.length > 0 ||
    detail.tags.length > 0;
  const hasLinks = Boolean(project.url || project.githubUrl);
  // Rendered only when at least one date is set — never a placeholder.
  const projectDateRange = formatDateRange(project.startDate, project.endDate, false);

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
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
            Project
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-ink md:text-6xl">{project.name}</h1>
          {projectDateRange ? (
            <p className="mt-3 text-sm font-medium text-violet-200">{projectDateRange}</p>
          ) : null}
          {detail.experience ? (
            <p className="mt-3 text-sm text-muted">
              Built during{" "}
              <Link
                href={experienceHref(detail.experience)}
                className="text-violet-200 underline-offset-4 transition hover:underline"
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
                  className="rounded-lg bg-gradient-to-r from-violet-500 to-sky-400 px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Visit project ↗
                </a>
              ) : null}
              {project.githubUrl ? (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-violet-400/70 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-violet-300 hover:bg-violet-400/10"
                >
                  View source ↗
                </a>
              ) : null}
            </div>
          ) : null}
        </header>

        {hasDescription || hasDetails || hasArchitecture || hasMeta ? (
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
              {hasArchitecture ? (
                <section className="grid gap-4">
                  <h2 className="text-2xl font-semibold text-ink">Architecture</h2>
                  {project.architecture.trim().length > 0 ? (
                    <div className="glass-panel rounded-lg p-6 lg:p-8">
                      <RichText value={project.architecture} />
                    </div>
                  ) : null}
                  {architectureStackBoxes.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {architectureStackBoxes.map((box) => (
                        <ArchitectureStackCard key={box.title} box={box} />
                      ))}
                    </div>
                  ) : null}
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
    </>
  );
}

function ArchitectureStackCard({ box }: { box: ArchitectureStackBox }) {
  return (
    <section className="glass-panel rounded-lg p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-300">
        {box.title}
      </h3>
      <div className="mt-4 [&_.rich-text]:gap-2 [&_.rich-text]:text-sm [&_.rich-text]:leading-6">
        <RichText value={box.value} />
      </div>
    </section>
  );
}
