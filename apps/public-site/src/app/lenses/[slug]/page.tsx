import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getLensBySlug } from "@portfolio/db/queries";

import { ContentCard } from "@/components/content-card";
import { SectionHeading } from "@/components/section-heading";
import { getComingSoonFallback } from "@/lib/coming-soon-gate";

interface LensPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: LensPageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getLensBySlug(slug);

  if (!detail) {
    return {
      title: "Lens",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: detail.lens.name,
    description: detail.lens.summary,
    alternates: {
      canonical: `/lenses/${detail.lens.slug}`,
    },
    openGraph: {
      title: detail.lens.name,
      description: detail.lens.summary,
      url: `/lenses/${detail.lens.slug}`,
    },
  };
}

export default async function LensPage({ params }: LensPageProps) {
  const comingSoon = await getComingSoonFallback();

  if (comingSoon) {
    return comingSoon;
  }

  const { slug } = await params;
  const detail = await getLensBySlug(slug);

  if (!detail) {
    notFound();
  }

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
          Lens
        </p>
        <h1 className="max-w-4xl text-4xl font-semibold text-ink md:text-6xl">
          {detail.lens.name}
        </h1>
        {detail.lens.summary ? (
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted">{detail.lens.summary}</p>
        ) : null}
      </section>
      {detail.caseStudies.length > 0 ? (
        <section className="mx-auto max-w-7xl px-5 pb-16 lg:px-8">
          <SectionHeading title="Related Case Studies" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {detail.caseStudies.map((caseStudy) => (
              <ContentCard
                key={caseStudy.id}
                href={`/case-studies/${caseStudy.slug}`}
                title={caseStudy.title}
                description={caseStudy.excerpt}
                meta="Case study"
              />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
