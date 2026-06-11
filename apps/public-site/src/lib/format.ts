// Returns "" when there is nothing meaningful to show so callers can omit the
// element entirely rather than rendering a placeholder. "Present" is only ever
// shown for explicitly current records — never as a fallback for missing dates.
export function formatDateRange(
  startDate: string | null,
  endDate: string | null,
  isCurrent: boolean,
): string {
  const start = formatDate(startDate);
  const end = isCurrent ? "Present" : formatDate(endDate);

  if (start && end) {
    if (start === end) {
      return start;
    }
    return `${start} - ${end}`;
  }

  return start ?? end ?? "";
}

export function formatDate(value: string | null): string | null {
  if (!value) return null;
  
  const date = new Date(`${value}T00:00:00Z`);

  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
