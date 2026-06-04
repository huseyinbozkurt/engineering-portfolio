import type { Metadata } from "next";

import { getPublishedProjects } from "@portfolio/db/queries";

import { ContentCard } from "@/components/content-card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Projects",
  description: "Published engineering projects connected to principles, lenses, and case studies.",
  alternates: {
    canonical: "/projects",
  },
};

export const revalidate = 3600;

export default async function ProjectsPage() {
  const projects = await getPublishedProjects();

  return (
    <>
      <PageHeader
        eyebrow="Projects"
        title="Projects with the decisions attached."
        description="Project entries are managed as real content and can connect to technologies, principles, lenses, and case studies."
      />
      <section className="mx-auto max-w-7xl px-5 pb-16 lg:px-8">
        {projects.length === 0 ? (
          <EmptyState
            title="Projects will appear here"
            description="No published projects exist yet. Draft projects can be prepared in the admin app without appearing publicly."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ContentCard
                key={project.id}
                title={project.name}
                description={project.description}
                href={project.url ?? project.githubUrl ?? undefined}
                meta="Project"
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
