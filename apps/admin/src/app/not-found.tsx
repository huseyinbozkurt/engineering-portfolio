import Link from "next/link";

import { PageTitle } from "@/components/page-title";

export default function NotFoundPage() {
  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title="Admin page not found"
        description="This content area or record could not be found. It may have been deleted or moved."
        actions={
          <Link
            href="/"
            className="rounded-lg bg-teal-200 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-teal-100"
          >
            Back to dashboard
          </Link>
        }
      />
    </main>
  );
}
