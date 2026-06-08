import type { Metadata } from "next";

import { getPublishedExperiences } from "@portfolio/db/queries";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RecognitionCard, SectionHeader } from "@/components/portfolio-ui";
import { getComingSoonFallback } from "@/lib/coming-soon-gate";
import { getRecognitionItems } from "@/lib/portfolio-content";

export const metadata: Metadata = {
  title: "Recognition",
  description: "Awards and recognition connected to published professional experience.",
  alternates: {
    canonical: "/recognition",
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RecognitionPage() {
  const comingSoon = await getComingSoonFallback();

  if (comingSoon) {
    return comingSoon;
  }

  const experiences = await getPublishedExperiences();
  const recognitionItems = getRecognitionItems(experiences);

  return (
    <>
      <PageHeader
        eyebrow="Recognition"
        title="Awards and recognition from the work."
        description=""
      />
      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-16">
        {recognitionItems.length > 0 ? (
          <>
            <SectionHeader title="Recognition" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recognitionItems.map((item) => (
                <RecognitionCard key={item.id} item={item} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title="Recognition is coming soon."
            description="Awards and recognition will appear here after they are published from the admin experience records."
          />
        )}
      </section>
    </>
  );
}
