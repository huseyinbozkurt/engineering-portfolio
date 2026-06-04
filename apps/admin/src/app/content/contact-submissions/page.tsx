import { getContactSubmissions } from "@portfolio/db/queries";

import { EmptyPanel } from "@/components/empty-panel";
import { PageTitle } from "@/components/page-title";

export const dynamic = "force-dynamic";

export default async function ContactSubmissionsPage() {
  const submissions = await getContactSubmissions();

  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title="Contact Submissions"
        description="Messages sent through the public contact form. Reply details appear only when the sender requested contact back."
      />
      {submissions.length === 0 ? (
        <EmptyPanel
          title="No contact submissions yet"
          description="Messages sent from the public contact form will appear here."
        />
      ) : (
        <section className="grid gap-4">
          {submissions.map((submission) => (
            <article
              key={submission.id}
              className="rounded-lg border border-line bg-white/[0.025] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-ink">{submission.name}</h2>
                    {submission.wantsResponse ? (
                      <span className="rounded-full border border-teal-300/30 bg-teal-300/10 px-2 py-0.5 text-xs font-medium text-teal-100">
                        Contact back requested
                      </span>
                    ) : (
                      <span className="rounded-full border border-line bg-white/[0.04] px-2 py-0.5 text-xs font-medium text-muted">
                        No response requested
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    Received {formatSubmittedAt(submission.createdAt)}
                  </p>
                </div>
                {submission.email ? (
                  <a
                    className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:border-teal-300/50 hover:bg-white/[0.06]"
                    href={`mailto:${submission.email}`}
                  >
                    {submission.email}
                  </a>
                ) : null}
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted">
                {submission.message}
              </p>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

function formatSubmittedAt(value: Date): string {
  return value.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
