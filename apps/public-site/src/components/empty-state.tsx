interface EmptyStateProps {
  title: string;
  description: string;
  compact?: boolean;
}

export function EmptyState({ title, description, compact = false }: EmptyStateProps) {
  return (
    <div className="glass-panel rounded-lg p-6 shadow-glow">
      <div className="mb-4 h-1.5 w-16 rounded-full bg-gradient-to-r from-teal-300 via-amber-200 to-rose-300" />
      <h2 className={compact ? "text-lg font-semibold text-ink" : "text-2xl font-semibold text-ink"}>
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}
