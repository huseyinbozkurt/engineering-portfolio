import type { MetadataRoute } from "next";

import { experienceHref, projectHref } from "@/lib/paths";
import { getPublicSiteAvailability } from "@/lib/site-availability";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { content, shouldShowComingSoon } = await getPublicSiteAvailability();

  if (shouldShowComingSoon) {
    return [
      {
        url: siteConfig.url,
        lastModified: new Date(),
      },
    ];
  }

  const staticRoutes = [
    "",
    "/about",
    "/experience",
    "/projects",
    "/ai-insights",
    "/how-i-work",
    "/case-studies",
    "/recognition",
    "/contact",
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteConfig.url}${route}`,
      lastModified: new Date(),
    })),
    ...content.lenses.map((lens) => ({
      url: `${siteConfig.url}/lenses/${lens.slug}`,
      lastModified: lens.updatedAt,
    })),
    ...content.caseStudies.map((caseStudy) => ({
      url: `${siteConfig.url}/case-studies/${caseStudy.slug}`,
      lastModified: caseStudy.updatedAt,
    })),
    ...content.experiences.map((experience) => ({
      url: `${siteConfig.url}${experienceHref(experience)}`,
      lastModified: experience.updatedAt,
    })),
    ...content.projects.map((project) => ({
      url: `${siteConfig.url}${projectHref(project)}`,
      lastModified: project.updatedAt,
    })),
  ];
}
