import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { getComingSoonFallback } from "@/lib/coming-soon-gate";

export default async function NotFound() {
  const comingSoon = await getComingSoonFallback();

  if (comingSoon) {
    return comingSoon;
  }

  return (
    <section className="mx-auto max-w-3xl px-5 py-20 lg:px-8">
      <EmptyState
        title="Page not found"
        description="This page does not exist yet, or the content has not been published."
      />
      <Link
        href="/"
        className="mt-6 inline-flex rounded-lg bg-teal-200 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-100"
      >
        Return Home
      </Link>
    </section>
  );
}
