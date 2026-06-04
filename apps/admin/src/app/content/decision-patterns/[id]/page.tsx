import Link from "next/link";
import { notFound } from "next/navigation";

import { getDecisionPatternById, getPrinciples } from "@portfolio/db/queries";

import { deleteDecisionPatternAction, updateDecisionPatternAction } from "@/app/actions";
import { DeleteForm } from "@/components/delete-form";
import { DecisionPatternForm } from "@/components/forms/decision-pattern-form";
import { ModalPanel } from "@/components/modal-panel";
import { PageTitle } from "@/components/page-title";
import { RecordOverview } from "@/components/record-overview";

export const dynamic = "force-dynamic";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDecisionPatternPage({ params }: EditPageProps) {
  const { id } = await params;
  const [pattern, principles] = await Promise.all([getDecisionPatternById(id), getPrinciples()]);

  if (!pattern) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-8 lg:px-8">
      <Link
        href="/content/decision-patterns"
        className="text-sm text-muted transition hover:text-ink"
      >
        ← Back to decision patterns
      </Link>
      <div className="mt-4">
        <PageTitle title="Edit decision pattern" description="Update this decision pattern." />
      </div>
      <RecordOverview
        title={pattern.title}
        description={pattern.summary}
        details={[
          { label: "Status", value: pattern.status },
          { label: "Slug", value: pattern.slug },
          { label: "Position", value: pattern.position },
        ]}
        action={
          <ModalPanel
            triggerLabel="Edit pattern"
            title="Edit decision pattern"
            description="Make changes in the form, then confirm before saving."
            size="lg"
          >
            <DecisionPatternForm
              action={updateDecisionPatternAction}
              title={pattern.title}
              submitLabel="Save changes"
              principleOptions={principles.map((principle) => ({
                id: principle.id,
                label: principle.title,
              }))}
              defaults={pattern}
            />
          </ModalPanel>
        }
      />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-white/[0.02] p-4">
        <p className="text-sm text-muted">Permanently remove this decision pattern.</p>
        <DeleteForm
          action={deleteDecisionPatternAction}
          id={pattern.id}
          label="Delete pattern"
        />
      </div>
    </main>
  );
}
