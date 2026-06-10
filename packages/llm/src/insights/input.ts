import type {
  InsightRecordCounts,
  PortfolioInsightInput,
  PortfolioInsightRecord,
} from "@portfolio/validators";

/**
 * Pure normalization of published portfolio records into the compact
 * {@link PortfolioInsightInput} snapshot sent to the LLM. Issues stable `ref`
 * ids (`{type}:{slug-or-id}`), compacts text, extracts measurable-outcome
 * lines and technology signals, and maps join-table pairs to `relatedRefs`.
 *
 * The source shape is structural (satisfied by `getPublishedInsightSource()`
 * from @portfolio/db) so tests can pass plain objects.
 */

interface SourcePair {
  left: string;
  right: string;
}

export interface InsightSource {
  lenses: Array<{ id: string; slug: string; name: string; summary: string }>;
  principles: Array<{ id: string; slug: string; title: string; summary: string; body: string }>;
  decisionPatterns: Array<{
    id: string;
    slug: string;
    title: string;
    summary: string;
    body: string;
  }>;
  experiences: Array<{
    id: string;
    slug: string | null;
    company: string;
    role: string;
    startDate: string | null;
    endDate: string | null;
    isCurrent: boolean;
    summary: string;
    awards: string;
  }>;
  projects: Array<{
    id: string;
    slug: string;
    name: string;
    description: string;
    developmentTechStack: string;
    qaTechStack: string;
    aiIntegrationTechStack: string;
    deploymentTechStack: string;
    experienceId: string | null;
  }>;
  caseStudies: Array<{
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    context: string;
    problem: string;
    action: string;
    outcome: string;
    learning: string;
  }>;
  skills: Array<{ id: string; slug: string; name: string; category: string | null }>;
  tags: Array<{ id: string; slug: string; name: string; category: string | null }>;
  draftCounts: InsightRecordCounts;
  relations: {
    experienceLenses: SourcePair[];
    experiencePrinciples: SourcePair[];
    experienceSkills: SourcePair[];
    experienceTags: SourcePair[];
    projectLenses: SourcePair[];
    projectPrinciples: SourcePair[];
    projectSkills: SourcePair[];
    projectTags: SourcePair[];
    caseStudyLenses: SourcePair[];
    caseStudyPrinciples: SourcePair[];
    caseStudyExperiences: SourcePair[];
    caseStudyProjects: SourcePair[];
    caseStudySkills: SourcePair[];
    caseStudyTags: SourcePair[];
    decisionPatternPrinciples: SourcePair[];
  };
}

const SUMMARY_MAX = 800;
const OUTCOME_MAX = 220;

export function buildPortfolioInsightInput(source: InsightSource): PortfolioInsightInput {
  // Ref lookup tables: entity id -> ref, per type, for relation mapping.
  const lensRef = refMap(source.lenses, "lens");
  const principleRef = refMap(source.principles, "principle");
  const patternRef = refMap(source.decisionPatterns, "decision-pattern");
  const experienceRef = refMap(source.experiences, "experience");
  const projectRef = refMap(source.projects, "project");
  const caseStudyRef = refMap(source.caseStudies, "case-study");
  const skillRef = refMap(source.skills, "skill");
  const tagRef = refMap(source.tags, "tag");

  const skillNameById = new Map(source.skills.map((skill) => [skill.id, skill.name]));

  // Relation pairs grouped by owning record id (published targets only — a
  // pair whose target was filtered out of the published source maps nowhere).
  const related = {
    experience: groupRelations([
      [source.relations.experienceLenses, lensRef],
      [source.relations.experiencePrinciples, principleRef],
      [source.relations.experienceSkills, skillRef],
      [source.relations.experienceTags, tagRef],
    ]),
    project: groupRelations([
      [source.relations.projectLenses, lensRef],
      [source.relations.projectPrinciples, principleRef],
      [source.relations.projectSkills, skillRef],
      [source.relations.projectTags, tagRef],
    ]),
    caseStudy: groupRelations([
      [source.relations.caseStudyLenses, lensRef],
      [source.relations.caseStudyPrinciples, principleRef],
      [source.relations.caseStudyExperiences, experienceRef],
      [source.relations.caseStudyProjects, projectRef],
      [source.relations.caseStudySkills, skillRef],
      [source.relations.caseStudyTags, tagRef],
    ]),
    decisionPattern: groupRelations([
      [source.relations.decisionPatternPrinciples, principleRef],
    ]),
  };

  const relatedSkillNames = (pairs: SourcePair[], ownerId: string): string[] =>
    pairs
      .filter((pair) => pair.left === ownerId && skillNameById.has(pair.right))
      .map((pair) => skillNameById.get(pair.right)!)
      .slice(0, 24);

  const records: PortfolioInsightInput["records"] = {
    lenses: source.lenses.map((lens) =>
      pruned({
        ref: lensRef.get(lens.id)!,
        type: "lens" as const,
        title: lens.name,
        summary: compactText(lens.summary, SUMMARY_MAX),
      }),
    ),
    principles: source.principles.map((principle) =>
      pruned({
        ref: principleRef.get(principle.id)!,
        type: "principle" as const,
        title: principle.title,
        summary: compactText([principle.summary, principle.body].join(" "), SUMMARY_MAX),
      }),
    ),
    decisionPatterns: source.decisionPatterns.map((pattern) =>
      pruned({
        ref: patternRef.get(pattern.id)!,
        type: "decision-pattern" as const,
        title: pattern.title,
        summary: compactText([pattern.summary, pattern.body].join(" "), SUMMARY_MAX),
        relatedRefs: related.decisionPattern.get(pattern.id),
      }),
    ),
    experiences: source.experiences.map((experience) => {
      const awards = splitLines(experience.awards).map((line) =>
        compactText(line, OUTCOME_MAX),
      );
      return pruned({
        ref: experienceRef.get(experience.id)!,
        type: "experience" as const,
        title: `${experience.role} at ${experience.company}`,
        role: experience.role,
        startDate: experience.startDate ?? undefined,
        endDate: experience.endDate ?? undefined,
        isCurrent: experience.isCurrent,
        summary: compactText(experience.summary, SUMMARY_MAX),
        outcomes: extractMeasurableLines(experience.summary),
        awards: awards.length > 0 ? awards.slice(0, 6) : undefined,
        technologies: orUndefined(
          relatedSkillNames(source.relations.experienceSkills, experience.id),
        ),
        relatedRefs: related.experience.get(experience.id),
      });
    }),
    projects: source.projects.map((project) => {
      const stackLines = [
        project.developmentTechStack,
        project.qaTechStack,
        project.aiIntegrationTechStack,
        project.deploymentTechStack,
      ].flatMap(extractStackItems);
      const technologies = dedupe([
        ...relatedSkillNames(source.relations.projectSkills, project.id),
        ...stackLines,
      ]).slice(0, 24);
      const relatedRefs = [
        ...(related.project.get(project.id) ?? []),
        ...(project.experienceId && experienceRef.has(project.experienceId)
          ? [experienceRef.get(project.experienceId)!]
          : []),
      ];
      return pruned({
        ref: projectRef.get(project.id)!,
        type: "project" as const,
        title: project.name,
        summary: compactText(project.description, SUMMARY_MAX),
        outcomes: extractMeasurableLines(project.description),
        technologies: orUndefined(technologies),
        relatedRefs: orUndefined(dedupe(relatedRefs).slice(0, 40)),
      });
    }),
    caseStudies: source.caseStudies.map((caseStudy) =>
      pruned({
        ref: caseStudyRef.get(caseStudy.id)!,
        type: "case-study" as const,
        title: caseStudy.title,
        summary: compactText(
          [
            caseStudy.excerpt,
            caseStudy.context,
            caseStudy.problem,
            caseStudy.action,
            caseStudy.outcome,
            caseStudy.learning,
          ].join(" "),
          900,
        ),
        outcomes: extractMeasurableLines(caseStudy.outcome),
        technologies: orUndefined(
          relatedSkillNames(source.relations.caseStudySkills, caseStudy.id),
        ),
        relatedRefs: related.caseStudy.get(caseStudy.id),
      }),
    ),
    skills: source.skills.map((skill) =>
      pruned({
        ref: skillRef.get(skill.id)!,
        type: "skill" as const,
        title: skill.name,
        category: skill.category ?? undefined,
        summary: "",
      }),
    ),
    tags: source.tags.map((tag) =>
      pruned({
        ref: tagRef.get(tag.id)!,
        type: "tag" as const,
        title: tag.name,
        category: tag.category ?? undefined,
        summary: "",
      }),
    ),
  };

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      scope: "published-only",
      totals: {
        lenses: records.lenses.length,
        principles: records.principles.length,
        decisionPatterns: records.decisionPatterns.length,
        experiences: records.experiences.length,
        projects: records.projects.length,
        caseStudies: records.caseStudies.length,
        skills: records.skills.length,
        tags: records.tags.length,
      },
      draftCounts: source.draftCounts,
    },
    records,
  };
}

/** True when the snapshot has nothing meaningful to analyze. */
export function isInsightInputEmpty(input: PortfolioInsightInput): boolean {
  const { totals } = input.meta;
  return (
    totals.experiences === 0 &&
    totals.projects === 0 &&
    totals.caseStudies === 0 &&
    totals.skills === 0
  );
}

function refMap(
  rows: Array<{ id: string; slug?: string | null }>,
  type: string,
): Map<string, string> {
  return new Map(rows.map((row) => [row.id, `${type}:${row.slug || row.id}`]));
}

function groupRelations(
  groups: Array<[SourcePair[], Map<string, string>]>,
): Map<string, string[]> {
  const byOwner = new Map<string, string[]>();
  for (const [pairs, targetRef] of groups) {
    for (const pair of pairs) {
      const ref = targetRef.get(pair.right);
      if (!ref) {
        continue;
      }
      byOwner.set(pair.left, [...(byOwner.get(pair.left) ?? []), ref]);
    }
  }
  for (const [owner, refs] of byOwner) {
    byOwner.set(owner, dedupe(refs).slice(0, 40));
  }
  return byOwner;
}

export function compactText(value: string, maxLength: number): string {
  const compacted = value.replace(/\s+/g, " ").trim();
  if (compacted.length <= maxLength) {
    return compacted;
  }
  return `${compacted.slice(0, maxLength - 3)}...`;
}

/** Sentences/lines containing numbers or percentages — measurable outcomes. */
export function extractMeasurableLines(value: string): string[] | undefined {
  const sentences = value
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const measurable = sentences
    .filter((sentence) => /\d/.test(sentence))
    .map((sentence) => compactText(sentence, OUTCOME_MAX))
    .slice(0, 8);

  return measurable.length > 0 ? measurable : undefined;
}

/** Short list items from a rich-text tech-stack field (bullet lines). */
function extractStackItems(value: string): string[] {
  return splitLines(value)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter((line) => line.length > 1 && line.length <= 80)
    .slice(0, 12);
}

function splitLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values));
}

function orUndefined(values: string[]): string[] | undefined {
  return values.length > 0 ? values : undefined;
}

/** Drops undefined optional keys so the snapshot serializes compactly. */
function pruned<T extends Record<string, unknown>>(record: T): PortfolioInsightRecord {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as unknown as PortfolioInsightRecord;
}
