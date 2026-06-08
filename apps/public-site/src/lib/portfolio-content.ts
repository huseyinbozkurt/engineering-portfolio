import type {
  CaseStudyRecord,
  ExperienceRecord,
  HomeContentRecord,
  PrincipleRecord,
  ProjectRecord,
  SkillRecord,
} from "@portfolio/db/queries";

import { formatDateRange } from "@/lib/format";

export interface RecognitionItem {
  id: string;
  title: string;
  source: string;
  detail: string;
  date: string;
  href: string;
}

export interface DerivedMetric {
  label: string;
  value: string;
  detail?: string | undefined;
}

export function getRoleLabel(experiences: ExperienceRecord[]): string {
  const experience = experiences.find((item) => item.isCurrent) ?? experiences[0];

  return experience?.role ?? "";
}

export function getHeroSummary({
  contactIntro,
  experiences,
}: {
  contactIntro?: string | null | undefined;
  experiences: ExperienceRecord[];
}): string {
  const profileIntro = contactIntro?.trim();

  if (profileIntro) {
    return profileIntro;
  }

  return experiences.find((experience) => experience.summary.trim())?.summary.trim() ?? "";
}

export function getHeroHeadline(content: HomeContentRecord): string {
  const latestCaseStudy = content.caseStudies.find((caseStudy) => caseStudy.outcome.trim());
  const latestExperience = content.experiences.find((experience) => experience.summary.trim());
  const latestProject = content.projects.find((project) => project.description.trim());
  const source =
    latestCaseStudy?.outcome.trim() ||
    latestExperience?.summary.trim() ||
    latestProject?.description.trim() ||
    content.principles[0]?.summary.trim() ||
    "";

  return firstSentence(source);
}

export function getSkillCategoryChips({
  skills,
  lenses,
}: {
  skills: SkillRecord[];
  lenses: HomeContentRecord["lenses"];
}): string[] {
  const skillCategories = uniqueStrings(
    skills
      .map((skill) => skill.category?.trim())
      .filter((category): category is string => Boolean(category)),
  );

  if (skillCategories.length > 0) {
    return skillCategories.slice(0, 6);
  }

  return lenses.map((lens) => lens.name).filter(Boolean).slice(0, 6);
}

export function getOperatingPrinciples(principles: PrincipleRecord[]): PrincipleRecord[] {
  return principles.slice(0, 4);
}

export function getImpactMetrics(content: HomeContentRecord): DerivedMetric[] {
  const metrics: DerivedMetric[] = [];
  const totalYears = getTotalExperienceYears(content.experiences);
  const activeYears = getActiveExperienceYears(content.experiences);
  const awards = getRecognitionItems(content.experiences);

  if (content.caseStudies.length > 0) {
    metrics.push({
      label: "Impact stories",
      value: `${content.caseStudies.length}`,
      detail: "Published case studies",
    });
  }

  if (content.projects.length > 0) {
    metrics.push({
      label: "Projects delivered",
      value: `${content.projects.length}`,
      detail: "Published projects",
    });
  }

  if (content.skills.length > 0) {
    metrics.push({
      label: "Skill areas",
      value: `${getSkillCategoryChips({ skills: content.skills, lenses: content.lenses }).length}`,
      detail: "Published categories",
    });
  }

  if (totalYears > 0) {
    metrics.push({
      label: "Professional experience",
      value: `${totalYears}+`,
      detail: activeYears,
    });
  }

  if (awards.length > 0) {
    metrics.push({
      label: "Recognition",
      value: `${awards.length}`,
      detail: "Published awards",
    });
  }

  return metrics.slice(0, 5);
}

export function getRecognitionItems(experiences: ExperienceRecord[]): RecognitionItem[] {
  return experiences.flatMap((experience) => {
    const date = formatDateRange(experience.startDate, experience.endDate, experience.isCurrent);
    const source = `${experience.company}${experience.role ? ` / ${experience.role}` : ""}`;

    return parseAwards(experience.awards).map((award, index) => {
      const parsed = splitRecognitionTitle(award);

      return {
        id: `${experience.id}-${index}`,
        title: parsed.title,
        detail: parsed.detail,
        source,
        date,
        href: `/experience/${experience.slug || experience.id}`,
      };
    });
  });
}

export function getProjectMeta(project: ProjectRecord): string {
  const stackCount = [
    project.developmentTechStack,
    project.qaTechStack,
    project.aiIntegrationTechStack,
    project.deploymentTechStack,
  ].filter((value) => value.trim()).length;

  if (stackCount > 0) {
    return `${stackCount} stack areas`;
  }

  return project.url || project.githubUrl ? "Linked project" : "Published project";
}

function getTotalExperienceYears(experiences: ExperienceRecord[]): number {
  if (experiences.length === 0) {
    return 0;
  }

  const ranges = experiences
    .map((experience) => ({
      start: parseDate(experience.startDate),
      end: experience.isCurrent ? new Date() : parseDate(experience.endDate),
    }))
    .filter((range): range is { start: Date; end: Date } => Boolean(range.start && range.end));

  if (ranges.length === 0) {
    return 0;
  }

  const earliest = new Date(Math.min(...ranges.map((range) => range.start.getTime())));
  const latest = new Date(Math.max(...ranges.map((range) => range.end.getTime())));
  const years = latest.getUTCFullYear() - earliest.getUTCFullYear();

  return Math.max(1, years);
}

function getActiveExperienceYears(experiences: ExperienceRecord[]): string | undefined {
  const current = experiences.find((experience) => experience.isCurrent);

  if (!current) {
    return undefined;
  }

  const dateRange = formatDateRange(current.startDate, current.endDate, current.isCurrent);

  return dateRange ? `Current role: ${dateRange}` : undefined;
}

function parseDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  return new Date(`${value}T00:00:00Z`);
}

function parseAwards(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim().replace(/^(?:[-*]|\d+[.)])\s+/, ""))
    .filter(Boolean);
}

function splitRecognitionTitle(value: string): { title: string; detail: string } {
  const separators = [" - ", " – ", ": "];
  const separator = separators.find((candidate) => value.includes(candidate));

  if (!separator) {
    return {
      title: value,
      detail: "",
    };
  }

  const [title, ...detailParts] = value.split(separator);
  const normalizedTitle = title ?? value;

  return {
    title: normalizedTitle.trim(),
    detail: detailParts.join(separator).trim(),
  };
}

function firstSentence(value: string): string {
  const compact = value.replace(/\s+/g, " ").trim();

  if (!compact) {
    return "";
  }

  const match = compact.match(/^(.+?[.!?])(?:\s|$)/);

  return (match?.[1] ?? compact).trim();
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}
