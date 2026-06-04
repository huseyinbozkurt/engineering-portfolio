import type { MetadataRoute } from "next";

import {
  getPublishedCaseStudies,
  getPublishedExperiences,
  getPublishedLenses,
} from "@portfolio/db/queries";

import { experienceHref } from "@/lib/paths";
import { siteConfig } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/about",
    "/experience",
    "/projects",
    "/how-i-work",
    "/case-studies",
    "/contact",
  ];

  const [lenses, caseStudies, experiences] = await Promise.all([
    getPublishedLenses(),
    getPublishedCaseStudies(),
    getPublishedExperiences(),
  ]);

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteConfig.url}${route}`,
      lastModified: new Date(),
    })),
    ...lenses.map((lens) => ({
      url: `${siteConfig.url}/lenses/${lens.slug}`,
      lastModified: lens.updatedAt,
    })),
    ...caseStudies.map((caseStudy) => ({
      url: `${siteConfig.url}/case-studies/${caseStudy.slug}`,
      lastModified: caseStudy.updatedAt,
    })),
    ...experiences.map((experience) => ({
      url: `${siteConfig.url}${experienceHref(experience)}`,
      lastModified: experience.updatedAt,
    })),
  ];
}
