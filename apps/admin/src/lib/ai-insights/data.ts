import { getAdminContentIndex } from "@portfolio/db/queries";

import type {
  PortfolioInsightRecord,
  PortfolioInsightSnapshot,
  PortfolioInsightSummary,
} from "./types";

const caseStudySections = [
  ["Context", "context"],
  ["Problem", "problem"],
  ["Constraints", "constraints"],
  ["What I Did", "action"],
  ["Trade-offs", "tradeoffs"],
  ["Outcome", "outcome"],
  ["What I Learned", "learning"],
] as const;

const recordSummaryMaxChars = 700;

export async function getPortfolioInsightSnapshot(): Promise<PortfolioInsightSnapshot> {
  const content = await getAdminContentIndex();
  const totals = {
    lenses: content.lenses.length,
    principles: content.principles.length,
    decisionPatterns: content.decisionPatterns.length,
    experiences: content.experiences.length,
    projects: content.projects.length,
    caseStudies: content.caseStudies.length,
    skills: content.skills.length,
    tags: content.tags.length,
  };

  const caseStudySectionCoverage = content.caseStudies.map((caseStudy) => {
    const missingSections = caseStudySections
      .filter(([, key]) => !caseStudy[key].trim())
      .map(([label]) => label);

    return {
      title: caseStudy.title,
      missingSections,
      completedSections: caseStudySections.length - missingSections.length,
      totalSections: caseStudySections.length,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    isEmpty: Object.values(totals).every((total) => total === 0),
    totals,
    statusCounts: statusCounts([
      ...content.lenses,
      ...content.principles,
      ...content.decisionPatterns,
      ...content.experiences,
      ...content.projects,
      ...content.caseStudies,
      ...content.skills,
      ...content.tags,
    ]),
    skillDistribution: skillDistribution(
      content.skills.map((skill) => skill.category?.trim() || "Uncategorized"),
    ),
    caseStudySectionCoverage,
    records: {
      lenses: content.lenses.map((lens) =>
        record(lens.name, lens.status, lens.summary, {
          slug: lens.slug,
          accentColor: lens.accentColor,
        }),
      ),
      principles: content.principles.map((principle) =>
        record(principle.title, principle.status, [principle.summary, principle.body].join("\n"), {
          slug: principle.slug,
        }),
      ),
      decisionPatterns: content.decisionPatterns.map((pattern) =>
        record(pattern.title, pattern.status, [pattern.summary, pattern.body].join("\n"), {
          slug: pattern.slug,
        }),
      ),
      experiences: content.experiences.map((experience) =>
        record(
          `${experience.role} at ${experience.company}`,
          experience.status,
          experience.summary,
          {
            company: experience.company,
            role: experience.role,
            isCurrent: experience.isCurrent,
            startDate: experience.startDate,
            endDate: experience.endDate,
          },
        ),
      ),
      projects: content.projects.map((project) =>
        record(project.name, project.status, project.description, {
          slug: project.slug,
          hasUrl: Boolean(project.url),
          hasGithubUrl: Boolean(project.githubUrl),
        }),
      ),
      caseStudies: content.caseStudies.map((caseStudy) =>
        record(
          caseStudy.title,
          caseStudy.status,
          [
            caseStudy.excerpt,
            caseStudy.context,
            caseStudy.problem,
            caseStudy.constraints,
            caseStudy.action,
            caseStudy.tradeoffs,
            caseStudy.outcome,
            caseStudy.learning,
          ].join("\n"),
          {
            slug: caseStudy.slug,
            missingSections:
              caseStudySectionCoverage.find((coverage) => coverage.title === caseStudy.title)
                ?.missingSections.join(", ") || null,
          },
        ),
      ),
      skills: content.skills.map((skill) =>
        record(skill.name, skill.status, skill.summary, {
          slug: skill.slug,
          category: skill.category,
        }),
      ),
      tags: content.tags.map((tag) =>
        record(tag.name, tag.status, tag.slug, {
          category: tag.category,
        }),
      ),
    },
  };
}

export function summarizePortfolioSnapshot(
  snapshot: PortfolioInsightSnapshot,
): PortfolioInsightSummary {
  return {
    totals: snapshot.totals,
    statusCounts: snapshot.statusCounts,
    skillDistribution: snapshot.skillDistribution,
    missingCaseStudySections: snapshot.caseStudySectionCoverage.reduce(
      (total, coverage) => total + coverage.missingSections.length,
      0,
    ),
    isEmpty: snapshot.isEmpty,
  };
}

function record(
  title: string,
  status: string,
  summary: string,
  metadata?: PortfolioInsightRecord["metadata"],
): PortfolioInsightRecord {
  const result: PortfolioInsightRecord = {
    title,
    status,
    summary: compactText(summary, recordSummaryMaxChars),
  };

  if (metadata) {
    result.metadata = metadata;
  }

  return result;
}

function compactText(value: string, maxLength: number): string {
  const compacted = value.replace(/\s+/g, " ").trim();

  if (compacted.length <= maxLength) {
    return compacted;
  }

  return `${compacted.slice(0, maxLength - 3)}...`;
}

function statusCounts(records: Array<{ status: string }>): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const record of records) {
    counts[record.status] = (counts[record.status] ?? 0) + 1;
  }

  return counts;
}

function skillDistribution(categories: string[]): Array<{ category: string; count: number }> {
  const counts = new Map<string, number>();

  for (const category of categories) {
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  return Array.from(counts, ([category, count]) => ({ category, count })).sort(
    (left, right) => right.count - left.count || left.category.localeCompare(right.category),
  );
}
