interface StatusBadgeProps {
  status: string | null | undefined;
  className?: string | undefined;
}

const statusLabels: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export function statusBadgeClass(status: string | null | undefined): string {
  switch (status) {
    case "published":
      return "ui-badge ui-badge-success";
    case "archived":
      return "ui-badge ui-badge-warning";
    default:
      return "ui-badge ui-badge-neutral";
  }
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const value = status ?? "draft";

  return (
    <span className={`${statusBadgeClass(value)} ${className ?? ""}`.trim()}>
      {statusLabels[value] ?? value}
    </span>
  );
}
