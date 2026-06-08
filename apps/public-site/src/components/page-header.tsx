interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string | undefined;
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <section className="quiet-grid border-b border-line">
      <div className="mx-auto max-w-7xl px-5 pb-10 pt-14 lg:px-8 lg:pb-14 lg:pt-20">
        {eyebrow ? (
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-ink md:text-6xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted">{description}</p>
        ) : null}
      </div>
    </section>
  );
}
