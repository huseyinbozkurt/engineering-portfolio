import type {
  AdminContentIndexRecord,
  CaseStudyRecord,
  ExperienceRecord,
  ProjectRecord,
} from "@portfolio/db/queries";
import {
  aiReviewFreshnessReason,
  computeAiReviewFreshness,
  isNeedsReview,
  summarizeReviewFreshness,
  type AiReviewFreshness,
  type ReviewFreshnessCounts,
} from "@portfolio/db/ai-review-freshness";

export type ReviewContentType = "experience" | "project" | "case_study";

export interface AiReviewUpdateItem {
  id: string;
  contentType: ReviewContentType;
  typeLabel: string;
  title: string;
  editHref: string;
  freshness: AiReviewFreshness;
  reason: string;
  score: number | null;
  updatedAt: Date;
  lastAiReviewAt: Date | null;
  actionLabel: string;
}

export interface AiReviewUpdatesByType {
  type: ReviewContentType;
  label: string;
  items: AiReviewUpdateItem[];
}

export interface AiReviewUpdatesModel {
  counts: ReviewFreshnessCounts;
  /** Needing-review items (not_reviewed | stale | failed), highest priority first. */
  items: AiReviewUpdateItem[];
  byType: AiReviewUpdatesByType[];
}

interface NormalizedRecord {
  id: string;
  contentType: ReviewContentType;
  typeLabel: string;
  title: string;
  editHref: string;
  aiReviewStatus: string;
  lastAiReviewAt: Date | null;
  updatedAt: Date;
  score: number | null;
}

const TYPE_GROUPS: Array<{ type: ReviewContentType; label: string }> = [
  { type: "experience", label: "Experiences" },
  { type: "project", label: "Projects" },
  { type: "case_study", label: "Case Studies" },
];

// Failed reviews are the most urgent, then never-reviewed, then stale edits.
const FRESHNESS_PRIORITY: Record<AiReviewFreshness, number> = {
  failed: 0,
  not_reviewed: 1,
  stale: 2,
  queued: 3,
  processing: 4,
  up_to_date: 5,
};

export function buildAiReviewUpdates(content: AdminContentIndexRecord): AiReviewUpdatesModel {
  const records: NormalizedRecord[] = [
    ...content.experiences.map(normalizeExperience),
    ...content.projects.map(normalizeProject),
    ...content.caseStudies.map(normalizeCaseStudy),
  ];

  const counts = summarizeReviewFreshness(records);

  const items: AiReviewUpdateItem[] = records
    .map(toUpdateItem)
    .filter((item) => isNeedsReview(item.freshness))
    .sort(
      (a, b) =>
        FRESHNESS_PRIORITY[a.freshness] - FRESHNESS_PRIORITY[b.freshness] ||
        b.updatedAt.getTime() - a.updatedAt.getTime(),
    );

  const byType: AiReviewUpdatesByType[] = TYPE_GROUPS.map(({ type, label }) => ({
    type,
    label,
    items: items.filter((item) => item.contentType === type),
  })).filter((group) => group.items.length > 0);

  return { counts, items, byType };
}

function toUpdateItem(record: NormalizedRecord): AiReviewUpdateItem {
  const freshness = computeAiReviewFreshness(record);

  return {
    id: record.id,
    contentType: record.contentType,
    typeLabel: record.typeLabel,
    title: record.title,
    editHref: record.editHref,
    freshness,
    reason: aiReviewFreshnessReason(freshness),
    score: record.score,
    updatedAt: record.updatedAt,
    lastAiReviewAt: record.lastAiReviewAt,
    actionLabel: actionLabelFor(freshness),
  };
}

function actionLabelFor(freshness: AiReviewFreshness): string {
  if (freshness === "failed") {
    return "Retry Review";
  }
  if (freshness === "not_reviewed") {
    return "Run Review";
  }
  return "Update Review";
}

function normalizeExperience(experience: ExperienceRecord): NormalizedRecord {
  const role = experience.role.trim();
  const company = experience.company.trim();

  return {
    id: experience.id,
    contentType: "experience",
    typeLabel: "Experience",
    title: role && company ? `${role} at ${company}` : role || company || "Untitled Experience",
    editHref: `/content/experiences/${experience.id}#ai-review`,
    aiReviewStatus: experience.aiReviewStatus,
    lastAiReviewAt: experience.lastAiReviewAt,
    updatedAt: experience.updatedAt,
    score: experience.contentQualityScore,
  };
}

function normalizeProject(project: ProjectRecord): NormalizedRecord {
  return {
    id: project.id,
    contentType: "project",
    typeLabel: "Project",
    title: project.name.trim() || "Untitled Project",
    editHref: `/content/projects/${project.id}#ai-review`,
    aiReviewStatus: project.aiReviewStatus,
    lastAiReviewAt: project.lastAiReviewAt,
    updatedAt: project.updatedAt,
    score: project.contentQualityScore,
  };
}

function normalizeCaseStudy(caseStudy: CaseStudyRecord): NormalizedRecord {
  return {
    id: caseStudy.id,
    contentType: "case_study",
    typeLabel: "Case Study",
    title: caseStudy.title.trim() || "Untitled Case Study",
    editHref: `/content/case-studies/${caseStudy.id}#ai-review`,
    aiReviewStatus: caseStudy.aiReviewStatus,
    lastAiReviewAt: caseStudy.lastAiReviewAt,
    updatedAt: caseStudy.updatedAt,
    score: caseStudy.contentQualityScore,
  };
}
