import Link from "next/link";

import { PageTitle } from "@/components/page-title";

export default function NotFoundPage() {
  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title="Admin page not found"
        description="This content area or record could not be found. It may have been deleted or moved."
        actions={
          <Link href="/" className="ui-btn-primary">
            Back to dashboard
          </Link>
        }
      />
    </main>
  );
}
