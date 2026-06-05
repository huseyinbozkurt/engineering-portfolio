import type { Experience, Project } from "@portfolio/types";

export function experienceHref(experience: Pick<Experience, "id" | "slug">): string {
  return `/experience/${experience.slug || experience.id}`;
}

export function projectHref(project: Pick<Project, "slug">): string {
  return `/projects/${project.slug}`;
}
