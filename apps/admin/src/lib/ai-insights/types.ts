export type InsightPriority = "high" | "medium" | "low";
export type InsightLevel = "strong" | "moderate" | "weak";

export interface InsightItem {
  title: string;
  detail: string;
  priority: InsightPriority;
  evidence: string[];
}

export interface ScoreInsight {
  score: number;
  level: InsightLevel;
  summary: string;
  strengths: string[];
  gaps: string[];
  evidence: string[];
}

export interface DistributionSegment {
  label: string;
  value: number;
  level: InsightLevel;
  summary: string;
}

export interface TechnicalSkillDistributionInsight {
  summary: string;
  segments: DistributionSegment[];
  gaps: string[];
}

export interface LeadershipOwnershipInsight {
  score: number;
  summary: string;
  signals: InsightItem[];
}

export interface AiInsightsReport {
  generatedAt: string;
  provider: {
    name: string;
    model: string | null;
  };
  overallPortfolioStrength: ScoreInsight;
  experienceCoverage: ScoreInsight;
  technicalSkillDistribution: TechnicalSkillDistributionInsight;
  leadershipOwnershipSignals: LeadershipOwnershipInsight;
  missingOrWeakAreas: InsightItem[];
  recommendedImprovements: InsightItem[];
  repeatedThemes: string[];
  inconsistencies: InsightItem[];
  groundedDataNotes: string[];
}

export interface PortfolioInsightRecord {
  title: string;
  status: string;
  summary: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface PortfolioInsightSnapshot {
  generatedAt: string;
  isEmpty: boolean;
  totals: {
    lenses: number;
    principles: number;
    decisionPatterns: number;
    experiences: number;
    projects: number;
    caseStudies: number;
    skills: number;
    tags: number;
  };
  statusCounts: Record<string, number>;
  skillDistribution: Array<{ category: string; count: number }>;
  caseStudySectionCoverage: Array<{
    title: string;
    missingSections: string[];
    completedSections: number;
    totalSections: number;
  }>;
  records: {
    lenses: PortfolioInsightRecord[];
    principles: PortfolioInsightRecord[];
    decisionPatterns: PortfolioInsightRecord[];
    experiences: PortfolioInsightRecord[];
    projects: PortfolioInsightRecord[];
    caseStudies: PortfolioInsightRecord[];
    skills: PortfolioInsightRecord[];
    tags: PortfolioInsightRecord[];
  };
}

export interface PortfolioInsightSummary {
  totals: PortfolioInsightSnapshot["totals"];
  statusCounts: Record<string, number>;
  skillDistribution: Array<{ category: string; count: number }>;
  missingCaseStudySections: number;
  isEmpty: boolean;
}

export interface AiInsightsActionState {
  status: "idle" | "success" | "error";
  message: string;
  report: AiInsightsReport | null;
  taskId: string | null;
}
