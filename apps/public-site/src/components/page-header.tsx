interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-10 pt-16 lg:px-8 lg:pb-14 lg:pt-24">
      {eyebrow ? <p className="mb-5 text-sm font-medium text-teal-200">{eyebrow}</p> : null}
      <h1 className="max-w-4xl text-4xl font-semibold text-ink md:text-6xl">{title}</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-muted">{description}</p>
    </section>
  );
}
