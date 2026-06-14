import type { TaxonomyReviewSource } from "@portfolio/db/taxonomy-review";
import type {
  TaxonomyEvidenceRef,
  TaxonomyReviewInput,
  TaxonomySupportingRecord,
} from "@portfolio/validators";

const SUMMARY_MAX = 1400;
const SUPPORTING_SUMMARY_MAX = 900;

export function buildTaxonomyReviewInput(
  source: TaxonomyReviewSource,
): TaxonomyReviewInput {
  const { index, relations } = source;

  const experienceRefs = new Map(
    index.experiences.map((experience) => [
      experience.id,
      evidenceRef(
        "experience",
        experience.slug || experience.id,
        experienceTitle(experience),
      ),
    ]),
  );
  const projectRefs = new Map(
    index.projects.map((project) => [
      project.id,
      evidenceRef("project", project.slug || project.id, project.name || project.slug),
    ]),
  );
  const caseStudyRefs = new Map(
    index.caseStudies.map((caseStudy) => [
      caseStudy.id,
      evidenceRef("caseStudy", caseStudy.slug || caseStudy.id, caseStudy.title || caseStudy.slug),
    ]),
  );

  const primaryRefsByGroup = {
    skills: usedByMap([
      [relations.experienceSkills, experienceRefs],
      [relations.projectSkills, projectRefs],
      [relations.caseStudySkills, caseStudyRefs],
    ]),
    tags: usedByMap([
      [relations.experienceTags, experienceRefs],
      [relations.projectTags, projectRefs],
      [relations.caseStudyTags, caseStudyRefs],
    ]),
    lenses: usedByMap([
      [relations.experienceLenses, experienceRefs],
      [relations.projectLenses, projectRefs],
      [relations.caseStudyLenses, caseStudyRefs],
    ]),
    principles: usedByMap([
      [relations.experiencePrinciples, experienceRefs],
      [relations.projectPrinciples, projectRefs],
      [relations.caseStudyPrinciples, caseStudyRefs],
    ]),
  };

  const principlePrimaryRefs = primaryRefsByGroup.principles;
  const decisionPatternPrimaryRefs = new Map<string, TaxonomyEvidenceRef[]>();
  for (const pair of relations.decisionPatternPrinciples) {
    const refs = principlePrimaryRefs.get(pair.right) ?? [];
    if (refs.length > 0) {
      decisionPatternPrimaryRefs.set(pair.left, [
        ...(decisionPatternPrimaryRefs.get(pair.left) ?? []),
        ...refs,
      ]);
    }
  }

  const skillNames = new Map(index.skills.map((skill) => [skill.id, skill.name]));
  const tagNames = new Map(index.tags.map((tag) => [tag.id, tag.name]));
  const lensNames = new Map(index.lenses.map((lens) => [lens.id, lens.name]));
  const principleNames = new Map(index.principles.map((principle) => [principle.id, principle.title]));

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      scope: "admin-all-records",
      totals: {
        experiences: index.experiences.length,
        caseStudies: index.caseStudies.length,
        projects: index.projects.length,
        skills: index.skills.length,
        tags: index.tags.length,
        lenses: index.lenses.length,
        principles: index.principles.length,
        decisionPatterns: index.decisionPatterns.length,
      },
    },
    primaryRecords: {
      experiences: index.experiences.map((experience) => ({
        ref: experienceRefs.get(experience.id)!,
        title: experienceTitle(experience),
        status: experience.status,
        summary: compactText(
          [experience.summary, experience.details, experience.awards].join(" "),
          SUMMARY_MAX,
        ),
        relatedTaxonomy: {
          skills: relatedNames(relations.experienceSkills, experience.id, skillNames),
          tags: relatedNames(relations.experienceTags, experience.id, tagNames),
          lenses: relatedNames(relations.experienceLenses, experience.id, lensNames),
          principles: relatedNames(
            relations.experiencePrinciples,
            experience.id,
            principleNames,
          ),
        },
      })),
      projects: index.projects.map((project) => ({
        ref: projectRefs.get(project.id)!,
        title: project.name || project.slug || project.id,
        status: project.status,
        summary: compactText(
          [
            project.description,
            project.details,
            project.architecture,
            project.developmentTechStack,
            project.qaTechStack,
            project.aiIntegrationTechStack,
            project.deploymentTechStack,
          ].join(" "),
          SUMMARY_MAX,
        ),
        technologies: dedupe(
          [
            project.developmentTechStack,
            project.qaTechStack,
            project.aiIntegrationTechStack,
            project.deploymentTechStack,
          ].flatMap(extractStackItems),
        ).slice(0, 32),
        relatedTaxonomy: {
          skills: relatedNames(relations.projectSkills, project.id, skillNames),
          tags: relatedNames(relations.projectTags, project.id, tagNames),
          lenses: relatedNames(relations.projectLenses, project.id, lensNames),
          principles: relatedNames(relations.projectPrinciples, project.id, principleNames),
        },
      })),
      caseStudies: index.caseStudies.map((caseStudy) => ({
        ref: caseStudyRefs.get(caseStudy.id)!,
        title: caseStudy.title || caseStudy.slug || caseStudy.id,
        status: caseStudy.status,
        summary: compactText(
          [
            caseStudy.excerpt,
            caseStudy.context,
            caseStudy.problem,
            caseStudy.constraints,
            caseStudy.action,
            caseStudy.tradeoffs,
            caseStudy.outcome,
            caseStudy.learning,
          ].join(" "),
          SUMMARY_MAX,
        ),
        relatedTaxonomy: {
          skills: relatedNames(relations.caseStudySkills, caseStudy.id, skillNames),
          tags: relatedNames(relations.caseStudyTags, caseStudy.id, tagNames),
          lenses: relatedNames(relations.caseStudyLenses, caseStudy.id, lensNames),
          principles: relatedNames(
            relations.caseStudyPrinciples,
            caseStudy.id,
            principleNames,
          ),
        },
      })),
    },
    supportingRecords: {
      skills: index.skills.map((skill) =>
        supportingRecord({
          id: skill.id,
          slug: skill.slug,
          label: skill.name,
          status: skill.status,
          category: skill.category,
          summary: skill.summary,
          usedBy: primaryRefsByGroup.skills.get(skill.id) ?? [],
        }),
      ),
      tags: index.tags.map((tag) =>
        supportingRecord({
          id: tag.id,
          slug: tag.slug,
          label: tag.name,
          status: tag.status,
          category: tag.category,
          usedBy: primaryRefsByGroup.tags.get(tag.id) ?? [],
        }),
      ),
      lenses: index.lenses.map((lens) =>
        supportingRecord({
          id: lens.id,
          slug: lens.slug,
          label: lens.name,
          status: lens.status,
          summary: lens.summary,
          usedBy: primaryRefsByGroup.lenses.get(lens.id) ?? [],
        }),
      ),
      principles: index.principles.map((principle) =>
        supportingRecord({
          id: principle.id,
          slug: principle.slug,
          label: principle.title,
          status: principle.status,
          summary: [principle.summary, principle.body].join(" "),
          usedBy: primaryRefsByGroup.principles.get(principle.id) ?? [],
        }),
      ),
      decisionPatterns: index.decisionPatterns.map((pattern) =>
        supportingRecord({
          id: pattern.id,
          slug: pattern.slug,
          label: pattern.title,
          status: pattern.status,
          summary: [pattern.summary, pattern.body].join(" "),
          usedBy: dedupeEvidence(decisionPatternPrimaryRefs.get(pattern.id) ?? []),
        }),
      ),
    },
  };
}

export function isTaxonomyReviewInputEmpty(input: TaxonomyReviewInput): boolean {
  return (
    input.meta.totals.experiences === 0 &&
    input.meta.totals.projects === 0 &&
    input.meta.totals.caseStudies === 0
  );
}

function evidenceRef(
  type: TaxonomyEvidenceRef["type"],
  id: string,
  title: string,
): TaxonomyEvidenceRef {
  return { type, id, title: title || id };
}

function experienceTitle(experience: {
  id: string;
  role: string;
  company: string;
}): string {
  const role = experience.role.trim();
  const company = experience.company.trim();
  if (role && company) {
    return `${role} at ${company}`;
  }
  return role || company || experience.id;
}

function usedByMap(
  relationGroups: Array<[Array<{ left: string; right: string }>, Map<string, TaxonomyEvidenceRef>]>,
): Map<string, TaxonomyEvidenceRef[]> {
  const refsBySupportingId = new Map<string, TaxonomyEvidenceRef[]>();

  for (const [relations, primaryRefs] of relationGroups) {
    for (const relation of relations) {
      const ref = primaryRefs.get(relation.left);
      if (!ref) {
        continue;
      }
      refsBySupportingId.set(relation.right, [
        ...(refsBySupportingId.get(relation.right) ?? []),
        ref,
      ]);
    }
  }

  for (const [id, refs] of refsBySupportingId) {
    refsBySupportingId.set(id, dedupeEvidence(refs).slice(0, 20));
  }

  return refsBySupportingId;
}

function relatedNames(
  relations: Array<{ left: string; right: string }>,
  ownerId: string,
  names: Map<string, string>,
): string[] {
  return relations
    .filter((relation) => relation.left === ownerId)
    .map((relation) => names.get(relation.right))
    .filter((name): name is string => Boolean(name))
    .slice(0, 32);
}

function supportingRecord(input: {
  id: string;
  slug: string;
  label: string;
  status: string;
  category?: string | null;
  summary?: string | null;
  usedBy: TaxonomyEvidenceRef[];
}): TaxonomySupportingRecord {
  const usedBy = dedupeEvidence(input.usedBy).slice(0, 20);
  return {
    id: input.id,
    slug: input.slug,
    label: input.label,
    status: input.status,
    ...(input.category ? { category: input.category } : {}),
    ...(input.summary ? { summary: compactText(input.summary, SUPPORTING_SUMMARY_MAX) } : {}),
    usageCount: usedBy.length,
    usedBy,
  };
}

function compactText(value: string, maxLength: number): string {
  const compacted = value.replace(/\s+/g, " ").trim();
  if (compacted.length <= maxLength) {
    return compacted;
  }
  return `${compacted.slice(0, maxLength - 3)}...`;
}

function extractStackItems(value: string): string[] {
  return value
    .split(/\r?\n|[,;]/)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter((line) => line.length > 1 && line.length <= 120)
    .slice(0, 16);
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values));
}

function dedupeEvidence(refs: TaxonomyEvidenceRef[]): TaxonomyEvidenceRef[] {
  const seen = new Set<string>();
  const deduped: TaxonomyEvidenceRef[] = [];

  for (const ref of refs) {
    const key = `${ref.type}:${ref.id}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(ref);
  }

  return deduped;
}
