interface StatusPillProps {
  label: string;
}

export function StatusPill({ label }: StatusPillProps) {
  return (
    <span className="rounded-lg border border-line bg-white/5 px-3 py-1 text-xs text-muted">
      {label}
    </span>
  );
}
