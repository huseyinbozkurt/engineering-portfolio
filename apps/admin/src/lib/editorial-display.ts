import { compactText, splitAdminListItems } from "@/lib/experience-display";

export { compactText, splitAdminListItems };

export function projectTitleLabel(project: {
  name: string;
  status?: string | null | undefined;
}): string {
  const name = project.name.trim();

  if (name) {
    return name;
  }

  return project.status === "draft" ? "Untitled Draft" : "Untitled Project";
}

export function caseStudyTitleLabel(caseStudy: {
  title: string;
  status?: string | null | undefined;
}): string {
  const title = caseStudy.title.trim();

  if (title) {
    return title;
  }

  return caseStudy.status === "draft" ? "Untitled Draft" : "Untitled Case Study";
}

export function formatProjectDateRange(
  startDate: string | null,
  endDate: string | null,
): string {
  const start = formatMonthYear(startDate);
  const end = formatMonthYear(endDate);

  if (start && end) {
    return start === end ? start : `${start} - ${end}`;
  }

  return start ?? end ?? "";
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
