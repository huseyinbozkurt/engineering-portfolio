interface EmptyPanelProps {
  title: string;
  description: string;
}

export function EmptyPanel({ title, description }: EmptyPanelProps) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white/[0.02] p-8 text-center">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}
