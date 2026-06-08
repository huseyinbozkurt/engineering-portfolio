interface SectionHeadingProps {
  title: string;
  description?: string | undefined;
}

export function SectionHeading({ title, description }: SectionHeadingProps) {
  return (
    <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="mb-4 h-px w-20 bg-gradient-to-r from-violet-300 via-sky-300 to-transparent" />
        <h2 className="text-2xl font-semibold text-ink md:text-3xl">{title}</h2>
      </div>
      {description ? (
        <p className="max-w-xl text-sm leading-6 text-muted md:text-right">{description}</p>
      ) : null}
    </div>
  );
}
