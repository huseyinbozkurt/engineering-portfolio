import type { Metadata } from "next";

import { getPublishedProjects } from "@portfolio/db/queries";

import { PageHeader } from "@/components/page-header";
import { ProjectCard } from "@/components/portfolio-ui";
import { getComingSoonFallback } from "@/lib/coming-soon-gate";
import { getProjectMeta } from "@/lib/portfolio-content";

export const metadata: Metadata = {
  title: "Projects",
  description: "Published engineering projects connected to principles, lenses, and case studies.",
  alternates: {
    canonical: "/projects",
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProjectsPage() {
  const comingSoon = await getComingSoonFallback();

  if (comingSoon) {
    return comingSoon;
  }

  const projects = await getPublishedProjects();

  return (
    <>
      <PageHeader
        eyebrow="Projects"
        title="Projects with the decisions attached."
        description=""
      />
      {projects.length > 0 ? (
        <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-16">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} meta={getProjectMeta(project)} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
