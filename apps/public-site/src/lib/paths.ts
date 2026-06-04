import type { Experience } from "@portfolio/types";

export function experienceHref(experience: Pick<Experience, "id" | "slug">): string {
  return `/experience/${experience.slug || experience.id}`;
}
