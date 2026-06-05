import { cache } from "react";

import { getHomeContent, type HomeContentRecord } from "@portfolio/db/queries";

export function hasPublishedContent(content: HomeContentRecord): boolean {
  return (
    content.lenses.length > 0 ||
    content.principles.length > 0 ||
    content.decisionPatterns.length > 0 ||
    content.experiences.length > 0 ||
    content.projects.length > 0 ||
    content.caseStudies.length > 0
  );
}

export const getPublicSiteAvailability = cache(async () => {
  const content = await getHomeContent();

  return {
    content,
    shouldShowComingSoon: !hasPublishedContent(content),
  };
});
