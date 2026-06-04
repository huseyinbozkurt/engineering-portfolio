import type {
  AiInsightsReport,
  DistributionSegment,
  InsightItem,
  InsightLevel,
  InsightPriority,
  ScoreInsight,
  TechnicalSkillDistributionInsight,
} from "./types";

export function parseAiInsightsReport(
  rawValue: string,
  provider: AiInsightsReport["provider"],
): AiInsightsReport {
  const parsed = JSON.parse(extractJson(rawValue)) as unknown;

  if (!isRecord(parsed)) {
    throw new Error("LLM response was not a JSON object.");
  }

  return {
    generatedAt: new Date().toISOString(),
    provider,
    overallPortfolioStrength: scoreInsight(parsed.overallPortfolioStrength),
    experienceCoverage: scoreInsight(parsed.experienceCoverage),
    technicalSkillDistribution: technicalSkillDistribution(parsed.technicalSkillDistribution),
    leadershipOwnershipSignals: {
      score: score(isRecord(parsed.leadershipOwnershipSignals) ? parsed.leadershipOwnershipSignals.score : 0),
      summary: stringValue(
        isRecord(parsed.leadershipOwnershipSignals)
          ? parsed.leadershipOwnershipSignals.summary
          : "",
      ),
      signals: insightItems(
        isRecord(parsed.leadershipOwnershipSignals)
          ? parsed.leadershipOwnershipSignals.signals
          : [],
      ),
    },
    missingOrWeakAreas: insightItems(parsed.missingOrWeakAreas),
    recommendedImprovements: insightItems(parsed.recommendedImprovements),
    repeatedThemes: stringArray(parsed.repeatedThemes),
    inconsistencies: insightItems(parsed.inconsistencies),
    groundedDataNotes: stringArray(parsed.groundedDataNotes),
  };
}

function extractJson(value: string): string {
  const trimmed = value.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("LLM response did not contain JSON.");
  }

  return trimmed.slice(start, end + 1);
}

function scoreInsight(value: unknown): ScoreInsight {
  const record = isRecord(value) ? value : {};

  return {
    score: score(record.score),
    level: level(record.level),
    summary: stringValue(record.summary),
    strengths: stringArray(record.strengths),
    gaps: stringArray(record.gaps),
    evidence: stringArray(record.evidence),
  };
}

function technicalSkillDistribution(value: unknown): TechnicalSkillDistributionInsight {
  const record = isRecord(value) ? value : {};
  const rawSegments = Array.isArray(record.segments) ? record.segments : [];

  return {
    summary: stringValue(record.summary),
    segments: rawSegments.map(distributionSegment).filter((segment) => segment.label),
    gaps: stringArray(record.gaps),
  };
}

function distributionSegment(value: unknown): DistributionSegment {
  const record = isRecord(value) ? value : {};

  return {
    label: stringValue(record.label),
    value: score(record.value),
    level: level(record.level),
    summary: stringValue(record.summary),
  };
}

function insightItems(value: unknown): InsightItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(insightItem).filter((item) => item.title || item.detail);
}

function insightItem(value: unknown): InsightItem {
  const record = isRecord(value) ? value : {};

  return {
    title: stringValue(record.title),
    detail: stringValue(record.detail),
    priority: priority(record.priority),
    evidence: stringArray(record.evidence),
  };
}

function score(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function priority(value: unknown): InsightPriority {
  return value === "high" || value === "medium" || value === "low" ? value : "medium";
}

function level(value: unknown): InsightLevel {
  return value === "strong" || value === "moderate" || value === "weak" ? value : "moderate";
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 8)
    : [];
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
