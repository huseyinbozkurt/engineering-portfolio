import { hasDatabaseUrl } from "@portfolio/db";
import {
  getDBAvailability,
  getHomeContent,
  type HomeContentRecord,
} from "@portfolio/db/queries";

export type ComingSoonReason =
  | "database_unavailable"
  | "no_published_content"
  | "published_content_found";

export interface PublicSiteAvailability {
  content: HomeContentRecord;
  counts: PublicContentCounts;
  isDbAvailable: boolean;
  hasPublishedContent: boolean;
  shouldShowComingSoon: boolean;
  reason: ComingSoonReason;
}

interface PublicContentCounts {
  lenses: number;
  principles: number;
  decisionPatterns: number;
  experiences: number;
  projects: number;
  caseStudies: number;
  skills: number;
}

export function hasPublishedContent(content: HomeContentRecord): boolean {
  return Object.values(getPublicContentCounts(content)).some((count) => count > 0);
}

export async function getPublicSiteAvailability(): Promise<PublicSiteAvailability> {
  const { isDbAvailable } = await getDBAvailability({
    source: "public-content-availability",
    force: true,
  });
  const content = isDbAvailable ? await getHomeContent() : emptyHomeContent();
  const counts = getPublicContentCounts(content);
  const publishedContentFound = hasPublishedContent(content);
  const shouldShowComingSoon = !isDbAvailable || !publishedContentFound;
  const reason = getComingSoonReason({
    isDbAvailable,
    hasPublishedContent: publishedContentFound,
  });

  logPublicContentAvailability({
    counts,
    hasPublishedContent: publishedContentFound,
    isDbAvailable,
    reason,
    shouldShowComingSoon,
  });

  return {
    content,
    counts,
    isDbAvailable,
    hasPublishedContent: publishedContentFound,
    shouldShowComingSoon,
    reason,
  };
}

function getPublicContentCounts(content: HomeContentRecord): PublicContentCounts {
  return {
    lenses: content.lenses.length,
    principles: content.principles.length,
    decisionPatterns: content.decisionPatterns.length,
    experiences: content.experiences.length,
    projects: content.projects.length,
    caseStudies: content.caseStudies.length,
    skills: content.skills.length,
  };
}

function getComingSoonReason({
  isDbAvailable,
  hasPublishedContent,
}: {
  isDbAvailable: boolean;
  hasPublishedContent: boolean;
}): ComingSoonReason {
  if (!isDbAvailable) {
    return "database_unavailable";
  }

  if (!hasPublishedContent) {
    return "no_published_content";
  }

  return "published_content_found";
}

function emptyHomeContent(): HomeContentRecord {
  return {
    lenses: [],
    principles: [],
    decisionPatterns: [],
    experiences: [],
    projects: [],
    caseStudies: [],
    skills: [],
    homepageSettings: null,
  };
}

function logPublicContentAvailability({
  counts,
  hasPublishedContent,
  isDbAvailable,
  reason,
  shouldShowComingSoon,
}: Omit<PublicSiteAvailability, "content">): void {
  console.info(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      component: "public-site-content",
      event: "public_content_availability_checked",
      databaseUrlConfigured: hasDatabaseUrl(),
      isDbAvailable,
      counts,
      hasPublishedContent,
      shouldShowComingSoon,
      comingSoonReason: reason,
      nodeEnv: process.env.NODE_ENV || null,
      nextRuntime: process.env.NEXT_RUNTIME || null,
      awsExecutionEnv: process.env.AWS_EXECUTION_ENV || null,
      awsRegion: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || null,
      ecsMetadataAvailable: Boolean(process.env.ECS_CONTAINER_METADATA_URI_V4),
    }),
  );
}
