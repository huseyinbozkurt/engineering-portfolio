interface StatusPillProps {
  label: string;
}

export function StatusPill({ label }: StatusPillProps) {
  return (
    <span className="rounded-lg border border-white/10 bg-white/[0.045] px-3 py-1 text-xs text-muted">
      {label}
    </span>
  );
}
