export function experienceRoleLabel(experience: {
  role: string;
  status?: string | null | undefined;
}): string {
  const role = experience.role.trim();

  if (role) {
    return role;
  }

  return experience.status === "draft" ? "Untitled Draft" : "Untitled Experience";
}

export function experienceCompanyLabel(experience: { company: string }): string {
  return experience.company.trim() || "Company not set";
}

export function experienceTitleLabel(experience: {
  role: string;
  company: string;
  status?: string | null | undefined;
}): string {
  const role = experience.role.trim();
  const company = experience.company.trim();

  if (role && company) {
    return `${role} at ${company}`;
  }

  return role || company || experienceRoleLabel(experience);
}

export function formatExperienceDateRange(
  startDate: string | null,
  endDate: string | null,
  isCurrent: boolean,
): string {
  const start = formatMonthYear(startDate);
  const end = isCurrent ? "Present" : formatMonthYear(endDate);

  if (start && end) {
    return start === end ? start : `${start} - ${end}`;
  }

  return start ?? end ?? "";
}

export function compactText(value: string, maxLength = 220): string {
  const normalized = value
    .replace(/[`*_>#\[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

export function splitAdminListItems(value: string): string[] {
  return value
    .split(/\r?\n|[,;|]/)
    .map((item) => item.trim().replace(/^(?:[-*]|\d+[.)])\s+/, ""))
    .filter((item) => item.length > 0);
}

function formatMonthYear(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
