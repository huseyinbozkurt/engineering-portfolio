export function formatDateRange(
  startDate: string | null,
  endDate: string | null,
  isCurrent: boolean,
): string {
  if (!startDate && !endDate) {
    return "Timeline coming soon";
  }

  const start = startDate ? formatDate(startDate) : "Start date coming soon";
  const end = isCurrent ? "Present" : endDate ? formatDate(endDate) : "End date coming soon";

  return `${start} - ${end}`;
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);

  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
