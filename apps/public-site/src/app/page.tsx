import Link from "next/link";

import { getHomeContent } from "@portfolio/db/queries";

import { ContentCard } from "@/components/content-card";
import { EmptyState } from "@/components/empty-state";
import { LensGrid } from "@/components/lens-grid";
import { SectionHeading } from "@/components/section-heading";
import { formatDateRange } from "@/lib/format";
import { experienceHref } from "@/lib/paths";

export const revalidate = 3600;

export default async function HomePage() {
  const content = await getHomeContent();
  const totals = [
    { label: "Lenses", value: content.lenses.length, href: "#lenses" },
    { label: "Principles", value: content.principles.length, href: "#principles" },
    { label: "Case studies", value: content.caseStudies.length, href: "#case-studies" },
    { label: "Projects", value: content.projects.length, href: "#projects" },
  ];

  return (
    <>
      <section className="quiet-grid border-b border-line">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div>
            <p className="mb-6 text-sm font-medium text-teal-200">Engineering portfolio</p>
            <h1 className="max-w-5xl text-5xl font-semibold text-ink md:text-7xl">
              Engineers wear different hats.
              <span className="mt-3 block text-muted">What problem are we solving today?</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-muted">
              Explore the work through lenses that reveal how decisions are made,
              systems are shaped, and outcomes are produced.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/how-i-work"
                className="rounded-lg bg-teal-200 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-100"
              >
                Explore How I Work
              </Link>
              <Link
                href="/case-studies"
                className="rounded-lg border border-line px-5 py-3 text-sm font-semibold text-ink transition hover:border-amber-200/60 hover:bg-white/7"
              >
                View Case Studies
              </Link>
            </div>
          </div>
          <div className="grid content-end gap-3">
            {totals.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="glass-panel group rounded-lg p-5 transition hover:border-teal-300/40 hover:bg-white/8"
              >
                <p className="text-4xl font-semibold text-ink">{item.value}</p>
                <p className="mt-2 text-sm text-muted transition group-hover:text-ink">
                  {item.label}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="lenses" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-14 lg:px-8 lg:py-20">
        <SectionHeading
          title="Explore By Lens"
          description="Each lens frames the same body of work from a different engineering responsibility."
        />
        <LensGrid lenses={content.lenses} />
      </section>

      <section id="case-studies" className="scroll-mt-24 border-y border-line bg-white/[0.025]">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
          <SectionHeading
            title="Case Study Highlights"
            description="Decisions, trade-offs, and outcomes will appear here as published case studies are added."
          />
          {content.caseStudies.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {content.caseStudies.slice(0, 3).map((caseStudy) => (
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
              title="Case studies are currently being prepared"
              description="The platform is ready to render case studies as soon as real content is published."
            />
          )}
        </div>
      </section>

      <section id="projects" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-14 lg:px-8 lg:py-20">
        <SectionHeading
          title="Projects"
          description="Projects connect implementation work to lenses, operating principles, and case studies."
        />
        {content.projects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {content.projects.slice(0, 3).map((project) => (
              <ContentCard
                key={project.id}
                title={project.name}
                description={project.description}
                href={project.url ?? project.githubUrl ?? "/projects"}
                meta="Project"
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Projects will appear here"
            description="Published projects will be listed here once real project records are ready."
          />
        )}
      </section>

      <section id="principles" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-14 lg:px-8 lg:py-20">
        <SectionHeading
          title="Operating Principles"
          description="Principles are managed as content and connected to experience, projects, and case studies."
        />
        {content.principles.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {content.principles.slice(0, 4).map((principle) => (
              <ContentCard
                key={principle.id}
                title={principle.title}
                description={principle.summary}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Operating principles coming soon"
            description="Principles will appear here once they are written in the admin application."
          />
        )}
      </section>
    </>
  );
}
