/** Short, stable date for management tables (e.g. "Jun 8, 2026"). */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
