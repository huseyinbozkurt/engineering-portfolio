/**
 * Builds absolute links to the public site for "View on site" affordances. Uses
 * the same `NEXT_PUBLIC_SITE_URL` the public app reads (apps/public-site/src/lib/site.ts),
 * falling back to the local dev origin.
 */
const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function publicSiteUrl(path: string): string {
  return `${PUBLIC_SITE_URL.replace(/\/$/, "")}${path}`;
}

/** Public URL for a record, or `null` when it has no standalone public page. */
export const publicHrefs = {
  project: (slug: string) => publicSiteUrl(`/projects/${slug}`),
  experience: (slugOrId: string) => publicSiteUrl(`/experience/${slugOrId}`),
  caseStudy: (slug: string) => publicSiteUrl(`/case-studies/${slug}`),
  lens: (slug: string) => publicSiteUrl(`/lenses/${slug}`),
} as const;
