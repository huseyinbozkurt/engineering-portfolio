// Returns "" when there is nothing meaningful to show so callers can omit the
// element entirely rather than rendering a placeholder.
export function formatDateRange(
  startDate: string | null,
  endDate: string | null,
  isCurrent: boolean,
): string {
  const start = startDate ? formatDate(startDate) : null;
  const end = isCurrent ? "Present" : endDate ? formatDate(endDate) : null;

  if (start && end) {
    return `${start} - ${end}`;
  }

  return start ?? end ?? "";
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);

  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
