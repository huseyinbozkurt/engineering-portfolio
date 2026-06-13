import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCaseStudyBySlug } from "@portfolio/db/queries";

import { RichText } from "@/components/rich-text";
import { SectionHeader } from "@/components/portfolio-ui";
import { StatusPill } from "@/components/status-pill";
import { MetaLink, MetaPanel } from "@/components/meta-panel-link";
import { getComingSoonFallback } from "@/lib/coming-soon-gate";
import { experienceHref, projectHref } from "@/lib/paths";
import { siteConfig } from "@/lib/site";


interface CaseStudyPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: CaseStudyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getCaseStudyBySlug(slug);

  if (!detail) {
    return {
      title: "Case Study",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: detail.caseStudy.title,
    description: detail.caseStudy.excerpt || siteConfig.description,
    alternates: {
      canonical: `/case-studies/${detail.caseStudy.slug}`,
    },
    openGraph: {
      title: detail.caseStudy.title,
      description: detail.caseStudy.excerpt || siteConfig.description,
      url: `/case-studies/${detail.caseStudy.slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: detail.caseStudy.title,
      description: detail.caseStudy.excerpt || siteConfig.description,
    },
  };
}

export default async function CaseStudyPage({ params }: CaseStudyPageProps) {
  const comingSoon = await getComingSoonFallback();

  if (comingSoon) {
    return comingSoon;
  }

  const { slug } = await params;
  const detail = await getCaseStudyBySlug(slug);

  if (!detail) {
    notFound();
  }

  const sections: CaseStudySection[] = [
    { title: "Context", value: detail.caseStudy.context, accent: "text-sky-200" },
    { title: "Problem", value: detail.caseStudy.problem, accent: "text-rose-200" },
    { title: "Constraints", value: detail.caseStudy.constraints, accent: "text-amber-200" },
    { title: "What I Did", value: detail.caseStudy.action, accent: "text-violet-200" },
    { title: "Trade-offs", value: detail.caseStudy.tradeoffs, accent: "text-amber-200" },
    { title: "Outcome", value: detail.caseStudy.outcome, accent: "text-emerald-200" },
    { title: "What I Learned", value: detail.caseStudy.learning, accent: "text-sky-200" },
  ].filter((section) => section.value.trim().length > 0);
  const hasSidebar =
    detail.lenses.length > 0 ||
    detail.principles.length > 0 ||
    detail.experiences.length > 0 ||
    detail.projects.length > 0 ||
    detail.skills.length > 0 ||
    detail.tags.length > 0;

  return (
    <>
      <section className="quiet-grid border-b border-line">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
          <Link
            href="/case-studies"
            className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-ink"
          >
            <span aria-hidden>←</span> All case studies
          </Link>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
            Case Study
          </p>
          <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-tight text-ink md:text-6xl">
            {detail.caseStudy.title}
          </h1>
          {detail.caseStudy.excerpt ? (
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted">
              {detail.caseStudy.excerpt}
            </p>
          ) : null}
          {detail.lenses.length > 0 || detail.principles.length > 0 ? (
            <div className="mt-7 flex flex-wrap gap-2">
              {detail.lenses.map((lens) => (
                <StatusPill key={lens.id} label={lens.name} />
              ))}
              {detail.principles.map((principle) => (
                <StatusPill key={principle.id} label={principle.title} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {sections.length > 0 || hasSidebar ? (
        <section className="mx-auto grid max-w-7xl gap-8 px-5 py-14 lg:grid-cols-[minmax(0,1fr)_20rem] lg:px-8 lg:py-16">
          {sections.length > 0 ? (
            <div>
              <SectionHeader title="Story Flow" />
              <div className="grid gap-4 md:grid-cols-2">
                {sections.map((section, index) => (
                  <CaseStudySectionCard key={section.title} section={section} index={index} />
                ))}
              </div>
            </div>
          ) : null}

          {hasSidebar ? (
            <aside className="grid content-start gap-6 mt-4 lg:mt-4">
              <SectionHeader title="" />
              <MetaPanel title="Related Experience">
                {detail.experiences.map((experience) => (
                  <MetaLink
                    key={experience.id}
                    href={experienceHref(experience)}
                    label={`${experience.role} at ${experience.company}`}
                  />
                ))}
              </MetaPanel>
              <MetaPanel title="Related Projects">
                {detail.projects.map((project) => (
                  <MetaLink key={project.id} href={projectHref(project)} label={project.name} />
                ))}
              </MetaPanel>
              <MetaPanel title="Skills">
                {detail.skills.map((skill) => (
                  <StatusPill key={skill.id} label={skill.name} />
                ))}
              </MetaPanel>
              <MetaPanel title="Focus Areas">
                {detail.tags.map((tag) => (
                  <StatusPill key={tag.id} label={tag.name} />
                ))}
              </MetaPanel>
            </aside>
          ) : null}
        </section>
      ) : null}
    </>
  );
}

interface CaseStudySection {
  title: string;
  value: string;
  accent: string;
}

function CaseStudySectionCard({
  section,
  index,
}: {
  section: CaseStudySection;
  index: number;
}) {
  return (
    <article className="glass-panel rounded-lg p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-ink">{section.title}</h2>
        <span className={`text-sm font-semibold ${section.accent}`}>
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <div className="mt-4 [&_.rich-text]:text-sm [&_.rich-text]:leading-7">
        <RichText value={section.value} />
      </div>
    </article>
  );
}


