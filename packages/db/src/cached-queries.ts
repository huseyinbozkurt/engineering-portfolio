import { unstable_cache } from "next/cache";

import {
  getContactProfile,
  getHomeContent,
  getPublishedCaseStudies,
  getPublishedDecisionPatterns,
  getPublishedExperiences,
  getPublishedLenses,
  getPublishedPrinciples,
  getPublishedProjects,
} from "./queries";

export const CACHE_TAGS = {
  publicContent: "public-content",
  homeContent: "home-content",
  contactProfile: "contact-profile",
  experiences: "experiences",
  projects: "projects",
  caseStudies: "case-studies",
  lenses: "lenses",
  principles: "principles",
  decisionPatterns: "decision-patterns",
} as const;

const DEFAULT_REVALIDATE_SECONDS = 300000;

/**
 * Home Page
 */
export const getCachedHomeContent = unstable_cache(
  async () => getHomeContent(),
  ["home-content"],
  {
    revalidate: DEFAULT_REVALIDATE_SECONDS,
    tags: [
      CACHE_TAGS.publicContent,
      CACHE_TAGS.homeContent,
    ],
  },
);

/**
 * Contact Page
 */
export const getCachedContactProfile = unstable_cache(
  async () => getContactProfile(),
  ["contact-profile"],
  {
    revalidate: DEFAULT_REVALIDATE_SECONDS,
    tags: [
      CACHE_TAGS.publicContent,
      CACHE_TAGS.contactProfile,
    ],
  },
);

/**
 * Individual public collections
 */
export const getCachedPublishedLenses = unstable_cache(
  async () => getPublishedLenses(),
  ["published-lenses"],
  {
    revalidate: DEFAULT_REVALIDATE_SECONDS,
    tags: [
      CACHE_TAGS.publicContent,
      CACHE_TAGS.lenses,
    ],
  },
);

export const getCachedPublishedPrinciples = unstable_cache(
  async () => getPublishedPrinciples(),
  ["published-principles"],
  {
    revalidate: DEFAULT_REVALIDATE_SECONDS,
    tags: [
      CACHE_TAGS.publicContent,
      CACHE_TAGS.principles,
    ],
  },
);

export const getCachedPublishedDecisionPatterns = unstable_cache(
  async () => getPublishedDecisionPatterns(),
  ["published-decision-patterns"],
  {
    revalidate: DEFAULT_REVALIDATE_SECONDS,
    tags: [
      CACHE_TAGS.publicContent,
      CACHE_TAGS.decisionPatterns,
    ],
  },
);

export const getCachedPublishedExperiences = unstable_cache(
  async () => getPublishedExperiences(),
  ["published-experiences"],
  {
    revalidate: DEFAULT_REVALIDATE_SECONDS,
    tags: [
      CACHE_TAGS.publicContent,
      CACHE_TAGS.experiences,
    ],
  },
);

export const getCachedPublishedProjects = unstable_cache(
  async () => getPublishedProjects(),
  ["published-projects"],
  {
    revalidate: DEFAULT_REVALIDATE_SECONDS,
    tags: [
      CACHE_TAGS.publicContent,
      CACHE_TAGS.projects,
    ],
  },
);

export const getCachedPublishedCaseStudies = unstable_cache(
  async () => getPublishedCaseStudies(),
  ["published-case-studies"],
  {
    revalidate: DEFAULT_REVALIDATE_SECONDS,
    tags: [
      CACHE_TAGS.publicContent,
      CACHE_TAGS.caseStudies,
    ],
  },
);