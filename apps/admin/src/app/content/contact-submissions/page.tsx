import { getContactSubmissions } from "@portfolio/db/queries";

import { ContactSubmissionsList } from "@/components/contact-submissions-list";
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
        <ContactSubmissionsList
          submissions={submissions.map((submission) => ({
            id: submission.id,
            mode: submission.mode,
            intent: submission.intent,
            name: submission.name,
            email: submission.email,
            wantsResponse: submission.wantsResponse,
            company: submission.company,
            roleTitle: submission.roleTitle,
            techStack: submission.techStack,
            problem: submission.problem,
            desiredOutcome: submission.desiredOutcome,
            timeline: submission.timeline,
            message: submission.message,
            createdAt: submission.createdAt,
          }))}
        />
      )}
    </main>
  );
}
