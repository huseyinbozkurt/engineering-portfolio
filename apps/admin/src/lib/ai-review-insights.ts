import type {
  AdminContentIndexRecord,
  AiReviewQualitySnapshotRecord,
  CaseStudyRecord,
  ExperienceRecord,
  ProjectRecord,
} from "@portfolio/db/queries";
import type { AiSuggestion } from "@portfolio/db/schema";

type ContentType = "experience" | "project" | "case_study";
type SuggestionBucket = "strengths" | "issues" | "suggestions";
type AiReviewStatus = "idle" | "queued" | "processing" | "completed" | "failed" | string;
type FindingGroup = {
  label: string;
  count: number;
  records: Map<string, { id: string; title: string; typeLabel: string; editHref: string }>;
  scores: number[];
};

export interface AiReviewInsightRecord {
  id: string;
  type: ContentType;
  typeLabel: string;
  title: string;
  editHref: string;
  score: number | null;
  reviewedAt: Date | null;
  reviewStatus: AiReviewStatus;
  reviewError: string | null;
  suggestions: AiSuggestion[];
}

export interface AggregatedFinding {
  label: string;
  count: number;
  records: Array<{ id: string; title: string; typeLabel: string; editHref: string }>;
  averageScore: number | null;
  severity: "low" | "medium" | "high";
}

export interface ContentTypeComparison {
  type: ContentType;
  label: string;
  total: number;
  reviewed: number;
  pending: number;
  failed: number;
  idle: number;
  coveragePct: number;
  averageScore: number | null;
  issueCount: number;
  suggestionCount: number;
}

export interface AttentionItem {
  id: string;
  title: string;
  typeLabel: string;
  editHref: string;
  score: number | null;
  status: AiReviewStatus;
  majorIssue: string;
  reasons: string[];
}

export interface QualityTrendPoint {
  label: string;
  score: number;
  reviewedAt: Date;
}

export interface AiReviewInsights {
  records: AiReviewInsightRecord[];
  reviewedRecords: AiReviewInsightRecord[];
  portfolioScore: number | null;
  trendDelta: number | null;
  reviewedCount: number;
  totalCount: number;
  failedCount: number;
  pendingCount: number;
  strengths: AggregatedFinding[];
  issues: AggregatedFinding[];
  suggestions: AggregatedFinding[];
  comparisons: ContentTypeComparison[];
  attention: AttentionItem[];
  trend: QualityTrendPoint[];
}

interface BuildInsightsInput {
  content: AdminContentIndexRecord;
  snapshots: AiReviewQualitySnapshotRecord[];
}

export function buildAiReviewInsights({
  content,
  snapshots,
}: BuildInsightsInput): AiReviewInsights {
  const records: AiReviewInsightRecord[] = [
    ...content.experiences.map(toExperienceReviewRecord),
    ...content.projects.map(toProjectReviewRecord),
    ...content.caseStudies.map(toCaseStudyReviewRecord),
  ];
  const reviewedRecords = records.filter((record) =>
    record.reviewStatus === "completed" && record.score !== null,
  );
  const portfolioScore = average(reviewedRecords.map((record) => record.score));
  const comparisons = buildComparisons(records);
  const trend = buildTrend(snapshots);
  const trendDelta = scoreTrendDelta(trend);

  return {
    records,
    reviewedRecords,
    portfolioScore,
    trendDelta,
    reviewedCount: reviewedRecords.length,
    totalCount: records.length,
    failedCount: records.filter((record) => record.reviewStatus === "failed").length,
    pendingCount: records.filter((record) =>
      record.reviewStatus === "queued" || record.reviewStatus === "processing",
    ).length,
    strengths: aggregateFindings(reviewedRecords, "strengths").slice(0, 8),
    issues: aggregateFindings(reviewedRecords, "issues").slice(0, 8),
    suggestions: aggregateFindings(reviewedRecords, "suggestions").slice(0, 10),
    comparisons,
    attention: buildAttentionQueue(records).slice(0, 8),
    trend,
  };
}

function toExperienceReviewRecord(experience: ExperienceRecord): AiReviewInsightRecord {
  const role = experience.role.trim();
  const company = experience.company.trim();
  const title = role && company ? `${role} at ${company}` : role || company || "Untitled Experience";

  return {
    id: experience.id,
    type: "experience",
    typeLabel: "Experience",
    title,
    editHref: `/content/experiences/${experience.id}#ai-review`,
    score: experience.contentQualityScore,
    reviewedAt: experience.lastAiReviewAt,
    reviewStatus: experience.aiReviewStatus,
    reviewError: experience.aiReviewError,
    suggestions: experience.aiSuggestions ?? [],
  };
}

function toProjectReviewRecord(project: ProjectRecord): AiReviewInsightRecord {
  return {
    id: project.id,
    type: "project",
    typeLabel: "Project",
    title: project.name.trim() || "Untitled Project",
    editHref: `/content/projects/${project.id}#ai-review`,
    score: project.contentQualityScore,
    reviewedAt: project.lastAiReviewAt,
    reviewStatus: project.aiReviewStatus,
    reviewError: project.aiReviewError,
    suggestions: project.aiSuggestions ?? [],
  };
}

function toCaseStudyReviewRecord(caseStudy: CaseStudyRecord): AiReviewInsightRecord {
  return {
    id: caseStudy.id,
    type: "case_study",
    typeLabel: "Case Study",
    title: caseStudy.title.trim() || "Untitled Case Study",
    editHref: `/content/case-studies/${caseStudy.id}#ai-review`,
    score: caseStudy.contentQualityScore,
    reviewedAt: caseStudy.lastAiReviewAt,
    reviewStatus: caseStudy.aiReviewStatus,
    reviewError: caseStudy.aiReviewError,
    suggestions: caseStudy.aiSuggestions ?? [],
  };
}

function aggregateFindings(
  records: AiReviewInsightRecord[],
  bucket: SuggestionBucket,
): AggregatedFinding[] {
  const groups = new Map<string, FindingGroup>();

  for (const record of records) {
    const items = record.suggestions.filter((item) => item.field === bucket);

    for (const item of items) {
      const label = canonicalFindingLabel(item.suggestion, bucket);
      const current: FindingGroup = groups.get(label) ?? createFindingGroup(label);

      current.count += 1;
      current.records.set(record.id, {
        id: record.id,
        title: record.title,
        typeLabel: record.typeLabel,
        editHref: record.editHref,
      });
      if (record.score !== null) {
        current.scores.push(record.score);
      }
      groups.set(label, current);
    }
  }

  return Array.from(groups.values())
    .map((group) => {
      const averageScore = average(group.scores);
      return {
        label: group.label,
        count: group.count,
        records: Array.from(group.records.values()),
        averageScore,
        severity: severityFor(bucket, group.count, averageScore),
      };
    })
    .sort((a, b) => b.count - a.count || (a.averageScore ?? 100) - (b.averageScore ?? 100));
}

function createFindingGroup(label: string): FindingGroup {
  return {
    label,
    count: 0,
    records: new Map(),
    scores: [],
  };
}

function buildComparisons(records: AiReviewInsightRecord[]): ContentTypeComparison[] {
  const groups: Array<{ type: ContentType; label: string }> = [
    { type: "experience", label: "Experiences" },
    { type: "project", label: "Projects" },
    { type: "case_study", label: "Case Studies" },
  ];

  return groups.map(({ type, label }) => {
    const items = records.filter((record) => record.type === type);
    const reviewed = items.filter((record) =>
      record.reviewStatus === "completed" && record.score !== null,
    );
    const issueCount = reviewed.reduce(
      (sum, record) => sum + record.suggestions.filter((item) => item.field === "issues").length,
      0,
    );
    const suggestionCount = reviewed.reduce(
      (sum, record) =>
        sum + record.suggestions.filter((item) => item.field === "suggestions").length,
      0,
    );

    return {
      type,
      label,
      total: items.length,
      reviewed: reviewed.length,
      pending: items.filter((record) =>
        record.reviewStatus === "queued" || record.reviewStatus === "processing",
      ).length,
      failed: items.filter((record) => record.reviewStatus === "failed").length,
      idle: items.filter((record) => record.reviewStatus === "idle").length,
      coveragePct: items.length === 0 ? 0 : Math.round((reviewed.length / items.length) * 100),
      averageScore: average(reviewed.map((record) => record.score)),
      issueCount,
      suggestionCount,
    };
  });
}

function buildAttentionQueue(records: AiReviewInsightRecord[]): AttentionItem[] {
  const now = Date.now();
  const staleMs = 1000 * 60 * 60 * 24 * 90;

  return records
    .map((record) => {
      const issues = record.suggestions.filter((item) => item.field === "issues");
      const reasons: string[] = [];
      let priority = 0;

      if (record.reviewStatus === "failed") {
        priority += 120;
        reasons.push("Review failed");
      }
      if (record.score !== null) {
        priority += Math.max(0, 100 - record.score);
        if (record.score < 70) {
          reasons.push("Low quality score");
        }
      } else if (record.reviewStatus === "idle") {
        priority += 35;
        reasons.push("Not reviewed");
      }
      if (issues.length > 0) {
        priority += issues.length * 8;
        reasons.push(`${issues.length} issue${issues.length === 1 ? "" : "s"} found`);
      }
      if (record.reviewedAt && now - record.reviewedAt.getTime() > staleMs) {
        priority += 18;
        reasons.push("Review is stale");
      }
      if (record.reviewStatus === "queued" || record.reviewStatus === "processing") {
        priority += 10;
        reasons.push("Review in progress");
      }

      return {
        item: {
          id: record.id,
          title: record.title,
          typeLabel: record.typeLabel,
          editHref: record.editHref,
          score: record.score,
          status: record.reviewStatus,
          majorIssue:
            readableReviewFailure(record.reviewError) ??
            (issues[0] ? canonicalFindingLabel(issues[0].suggestion, "issues") : reasons[0] ?? "No action needed"),
          reasons,
        },
        priority,
      };
    })
    .filter(({ priority }) => priority > 0)
    .sort((a, b) => b.priority - a.priority)
    .map(({ item }) => item);
}

function readableReviewFailure(error: string | null): string | null {
  if (!error) {
    return null;
  }

  if (error.toLowerCase().startsWith("failed query")) {
    return "Review failed; open the record for details.";
  }

  return error.length > 120 ? `${error.slice(0, 117).trim()}...` : error;
}

function buildTrend(snapshots: AiReviewQualitySnapshotRecord[]): QualityTrendPoint[] {
  const ordered = snapshots.slice().reverse();

  return ordered.map((snapshot, index) => {
    const rollingWindow = ordered.slice(0, index + 1).map((item) => item.qualityScore);

    return {
      label: `${index + 1}`,
      score: average(rollingWindow) ?? snapshot.qualityScore,
      reviewedAt: snapshot.reviewedAt,
    };
  });
}

function scoreTrendDelta(trend: QualityTrendPoint[]): number | null {
  if (trend.length < 4) {
    return null;
  }

  const sampleSize = Math.min(5, Math.floor(trend.length / 2));
  const previous = average(trend.slice(0, sampleSize).map((point) => point.score));
  const latest = average(trend.slice(-sampleSize).map((point) => point.score));

  if (previous === null || latest === null) {
    return null;
  }

  return Math.round(latest - previous);
}

function canonicalFindingLabel(value: string, bucket: SuggestionBucket): string {
  const normalized = value.toLowerCase();

  const rule = findingRules(bucket).find((candidate) =>
    candidate.keywords.some((keyword) => normalized.includes(keyword)),
  );

  if (rule) {
    return rule.label;
  }

  return sentenceLabel(value);
}

function findingRules(bucket: SuggestionBucket): Array<{ label: string; keywords: string[] }> {
  if (bucket === "strengths") {
    return [
      { label: "Strong ownership signals", keywords: ["ownership", "owned", "led", "responsibility"] },
      { label: "Clear business outcomes", keywords: ["outcome", "impact", "business", "value", "result"] },
      { label: "Good technical specificity", keywords: ["technical", "stack", "architecture", "system", "implementation"] },
      { label: "Well-structured narratives", keywords: ["structure", "narrative", "story", "clear", "organized"] },
      { label: "Consistent impact statements", keywords: ["measurable", "metric", "quant", "kpi", "evidence"] },
      { label: "Useful context and constraints", keywords: ["context", "constraint", "trade-off", "tradeoff"] },
    ];
  }

  return [
    { label: "Missing measurable outcomes", keywords: ["metric", "measurable", "quant", "kpi", "number"] },
    { label: "Outcomes need more clarity", keywords: ["outcome", "impact", "result", "value"] },
    { label: "Constraints are underdeveloped", keywords: ["constraint", "trade-off", "tradeoff", "limitation"] },
    { label: "Summaries or excerpts are thin", keywords: ["summary", "excerpt", "overview", "intro"] },
    { label: "Architecture detail is sparse", keywords: ["architecture", "diagram", "system design", "infrastructure"] },
    { label: "Technical specificity is missing", keywords: ["technical", "specific", "tool", "stack", "implementation"] },
    { label: "Ownership needs clarification", keywords: ["ownership", "role", "responsibility", "led"] },
    { label: "Narrative structure can improve", keywords: ["structure", "narrative", "story", "flow"] },
  ];
}

function sentenceLabel(value: string): string {
  const compact = value.replace(/\s+/g, " ").trim();
  const firstSentence = compact.match(/^(.+?[.!?])(?:\s|$)/)?.[1] ?? compact;
  const short = firstSentence.length > 70 ? `${firstSentence.slice(0, 67).trim()}...` : firstSentence;

  return short.charAt(0).toUpperCase() + short.slice(1);
}

function severityFor(
  bucket: SuggestionBucket,
  count: number,
  averageScore: number | null,
): "low" | "medium" | "high" {
  if (bucket === "strengths") {
    return "low";
  }

  if (count >= 4 || (averageScore !== null && averageScore < 65)) {
    return "high";
  }

  if (count >= 2 || (averageScore !== null && averageScore < 78)) {
    return "medium";
  }

  return "low";
}

function average(values: Array<number | null>): number | null {
  const valid = values.filter((value): value is number => typeof value === "number");

  if (valid.length === 0) {
    return null;
  }

  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length);
}
