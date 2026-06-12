import type {
  ProjectEngineeringSignals,
  ProjectSignals,
} from "@portfolio/validators";

export const projectVisibilityOptions = [
  { label: "Public", value: "public" },
  { label: "Private", value: "private" },
] as const;

export const projectTypeOptions = [
  { label: "Product", value: "product" },
  { label: "Internal tool", value: "internal-tool" },
  { label: "Experiment", value: "experiment" },
  { label: "Client work", value: "client-work" },
  { label: "Open source", value: "open-source" },
  { label: "Learning", value: "learning" },
] as const;

export const projectLifecycleOptions = [
  { label: "Idea", value: "idea" },
  { label: "Planning", value: "planning" },
  { label: "In progress", value: "in-progress" },
  { label: "Active", value: "active" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Completed", value: "completed" },
  { label: "Sunset", value: "sunset" },
] as const;

export const projectRoleOptions = [
  { label: "Solo builder", value: "solo-builder" },
  { label: "Technical lead", value: "technical-lead" },
  { label: "Team member", value: "team-member" },
  { label: "Founder", value: "founder" },
  { label: "Maintainer", value: "maintainer" },
  { label: "Advisor", value: "advisor" },
] as const;

export const projectConfidentialityOptions = [
  { label: "None", value: "none" },
  { label: "Anonymized", value: "anonymized" },
  { label: "NDA", value: "nda" },
] as const;

export const projectOwnershipOptions = [
  { label: "Contributor", value: "contributor" },
  { label: "Primary owner", value: "primary-owner" },
  { label: "End-to-end owner", value: "end-to-end-owner" },
] as const;

export const contributionCategoryOptions = [
  { label: "Architecture", value: "architecture" },
  { label: "Backend", value: "backend" },
  { label: "Frontend", value: "frontend" },
  { label: "Infrastructure", value: "infrastructure" },
  { label: "Testing", value: "testing" },
  { label: "Delivery", value: "delivery" },
  { label: "Product", value: "product" },
] as const;

export const outcomeTypeOptions = [
  { label: "Business", value: "business" },
  { label: "Engineering", value: "engineering" },
  { label: "Operational", value: "operational" },
  { label: "Learning", value: "learning" },
] as const;

export const evidenceTypeOptions = [
  { label: "Architecture diagram", value: "architecture-diagram" },
  { label: "Screenshot", value: "screenshot" },
  { label: "Demo video", value: "demo-video" },
  { label: "Store listing", value: "store-listing" },
  { label: "Blog post", value: "blog-post" },
  { label: "Documentation", value: "documentation" },
  { label: "Presentation", value: "presentation" },
  { label: "Other", value: "other" },
] as const;

export const evidenceVisibilityOptions = [
  { label: "Public", value: "public" },
  { label: "Private", value: "private" },
] as const;

export const repositoryVisibilityOptions = [
  { label: "Public", value: "public" },
  { label: "Private", value: "private" },
  { label: "Unavailable", value: "unavailable" },
] as const;

export const signalStrengthOptions = [
  { label: "None", value: "none" },
  { label: "Basic", value: "basic" },
  { label: "Strong", value: "strong" },
] as const;

export const defaultEngineeringSignals: ProjectEngineeringSignals = {
  testing: "none",
  ciCd: "none",
  observability: "none",
  documentation: "none",
  security: "none",
  infrastructure: "none",
  aiIntegration: "none",
};

export const defaultProjectSignals: ProjectSignals = {
  complexity: 3,
  ambiguity: 3,
  ownership: 3,
  crossFunctionality: 3,
  operationalResponsibility: 3,
  innovation: 3,
};

export const engineeringSignalLabels: Record<keyof ProjectEngineeringSignals, string> = {
  testing: "Testing",
  ciCd: "CI/CD",
  observability: "Observability",
  documentation: "Documentation",
  security: "Security",
  infrastructure: "Infrastructure",
  aiIntegration: "AI integration",
};

export const projectSignalLabels: Record<keyof ProjectSignals, string> = {
  complexity: "Complexity",
  ambiguity: "Ambiguity",
  ownership: "Ownership",
  crossFunctionality: "Cross-functionality",
  operationalResponsibility: "Operational responsibility",
  innovation: "Innovation",
};

export function optionLabel(
  options: readonly { label: string; value: string }[],
  value: string,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function normalizeEngineeringSignals(
  value: Partial<ProjectEngineeringSignals> | null | undefined,
): ProjectEngineeringSignals {
  return { ...defaultEngineeringSignals, ...(value ?? {}) };
}

export function normalizeProjectSignals(
  value: Partial<ProjectSignals> | null | undefined,
): ProjectSignals {
  return { ...defaultProjectSignals, ...(value ?? {}) };
}
