interface EmptyPanelProps {
  title: string;
  description: string;
}

export function EmptyPanel({ title, description }: EmptyPanelProps) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-white/[0.025] p-5">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}
