import type { ProjectRecord } from "@portfolio/db/queries";

export const projectTypeLabels: Record<ProjectRecord["projectType"], string> = {
  product: "Product",
  "internal-tool": "Internal Tool",
  experiment: "Experiment",
  "client-work": "Client Work",
  "open-source": "Open Source",
  learning: "Learning",
};

export const projectStatusLabels: Record<ProjectRecord["projectStatus"], string> = {
  idea: "Idea",
  planning: "Planning",
  "in-progress": "In Progress",
  active: "Active",
  maintenance: "Maintenance",
  completed: "Completed",
  sunset: "Sunset",
};

export const releaseStatusLabels: Record<ProjectRecord["releaseStatus"], string> = {
  released: "Released",
  "in-development": "In Development",
  prototype: "Prototype",
  "internal-only": "Internal Only",
  sunset: "Sunset",
};

export const projectRoleLabels: Record<ProjectRecord["projectRole"], string> = {
  "solo-builder": "Solo Builder",
  "technical-lead": "Technical Lead",
  "team-member": "Team Member",
  founder: "Founder",
  maintainer: "Maintainer",
  advisor: "Advisor",
};

export const projectOwnershipLabels: Record<ProjectRecord["ownership"], string> = {
  contributor: "Contributor",
  "primary-owner": "Primary Owner",
  "end-to-end-owner": "End-to-End Owner",
};

export const projectConfidentialityLabels: Record<ProjectRecord["confidentiality"], string> = {
  none: "Public Detail",
  anonymized: "Anonymized",
  nda: "Confidential",
};

export const contributionCategoryLabels: Record<
  ProjectRecord["contributions"][number]["category"],
  string
> = {
  architecture: "Architecture",
  backend: "Backend",
  frontend: "Frontend",
  infrastructure: "Infrastructure",
  testing: "Testing",
  delivery: "Delivery",
  product: "Product",
};

export const outcomeTypeLabels: Record<ProjectRecord["outcomes"][number]["type"], string> = {
  business: "Business",
  engineering: "Engineering",
  operational: "Operational",
  learning: "Learning",
};

export const evidenceTypeLabels: Record<ProjectRecord["evidence"][number]["type"], string> = {
  "architecture-diagram": "Architecture Diagram",
  screenshot: "Screenshot",
  "demo-video": "Demo Video",
  "store-listing": "Store Listing",
  "blog-post": "Blog Post",
  documentation: "Documentation",
  presentation: "Presentation",
  other: "Other",
};

export const engineeringSignalLabels: Record<keyof ProjectRecord["engineeringSignals"], string> = {
  testing: "Testing",
  ciCd: "CI/CD",
  observability: "Observability",
  documentation: "Documentation",
  security: "Security",
  infrastructure: "Infrastructure",
  aiIntegration: "AI Integration",
};

export const engineeringSignalStrengthLabels: Record<
  ProjectRecord["engineeringSignals"][keyof ProjectRecord["engineeringSignals"]],
  string
> = {
  none: "None",
  basic: "Basic",
  strong: "Strong",
};

export const projectSignalLabels: Record<keyof ProjectRecord["projectSignals"], string> = {
  complexity: "Complexity",
  ambiguity: "Ambiguity",
  ownership: "Ownership",
  crossFunctionality: "Cross-Functionality",
  operationalResponsibility: "Operational Responsibility",
  innovation: "Innovation",
};

export function getSafeProjectLinks(
  project: ProjectRecord,
  options: { includeRepository?: boolean } = {},
): { demoHref: string | null; repositoryHref: string | null } {
  const includeRepository = options.includeRepository ?? project.confidentiality !== "nda";
  const demoHref =
    project.releaseStatus === "released" ? project.demoUrl ?? project.url ?? null : null;
  const repositoryHref = getSafeRepositoryHref(project, includeRepository);

  return { demoHref, repositoryHref };
}

export function getPublicEvidence(project: ProjectRecord): ProjectRecord["evidence"] {
  return project.evidence.filter((item) => item.visibility === "public" && item.title.trim());
}

export function getVisibleMetrics(
  project: ProjectRecord,
  options: { includeConfidentialMetrics?: boolean } = {},
): ProjectRecord["metrics"] {
  if (project.confidentiality === "nda" && !options.includeConfidentialMetrics) {
    return [];
  }

  return project.metrics.filter((item) => item.label.trim() && item.value.trim());
}

export function getEngineeringSignalEntries(project: ProjectRecord) {
  return Object.entries(project.engineeringSignals)
    .filter(([, value]) => value !== "none")
    .map(([key, value]) => ({
      key: key as keyof ProjectRecord["engineeringSignals"],
      label: engineeringSignalLabels[key as keyof ProjectRecord["engineeringSignals"]],
      value,
      valueLabel: engineeringSignalStrengthLabels[value],
    }));
}

export function getProjectSignalEntries(project: ProjectRecord) {
  const entries = Object.entries(project.projectSignals).map(([key, value]) => ({
    key: key as keyof ProjectRecord["projectSignals"],
    label: projectSignalLabels[key as keyof ProjectRecord["projectSignals"]],
    value,
  }));
  const hasMeaningfulSignal = entries.some((entry) => entry.value !== 3);

  return hasMeaningfulSignal ? entries : [];
}

export function getProjectTechTags(project: ProjectRecord, limit = 5): string[] {
  return uniqueStrings(
    [
      project.developmentTechStack,
      project.qaTechStack,
      project.aiIntegrationTechStack,
      project.deploymentTechStack,
    ].flatMap(splitStackItems),
  ).slice(0, limit);
}

function getSafeRepositoryHref(project: ProjectRecord, includeRepository: boolean): string | null {
  if (!includeRepository || project.sourceAvailability !== "open-source") {
    return null;
  }

  if (project.repositoryUrl) {
    return project.repositoryUrl;
  }

  if (!project.repositoryUrl && project.githubUrl) {
    return project.githubUrl;
  }

  return null;
}

function splitStackItems(value: string): string[] {
  return value
    .split(/\r?\n|[,;|]/)
    .map((item) => item.trim().replace(/^(?:[-*]|\d+[.)])\s+/, ""))
    .filter((item) => item.length > 0 && item.length <= 40);
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}
