import type { Metadata } from "next";

import { getPublishedProjects } from "@portfolio/db/queries";

import { ContentCard } from "@/components/content-card";
import { PageHeader } from "@/components/page-header";
import { getComingSoonFallback } from "@/lib/coming-soon-gate";
import { projectHref } from "@/lib/paths";

export const metadata: Metadata = {
  title: "Projects",
  description: "Published engineering projects connected to principles, lenses, and case studies.",
  alternates: {
    canonical: "/projects",
  },
};

export const revalidate = 3600;

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
        <section className="mx-auto max-w-7xl px-5 pb-16 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ContentCard
                key={project.id}
                title={project.name}
                description={project.description}
                href={projectHref(project)}
                meta="Project"
              />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
