import Link from "next/link";
import { notFound } from "next/navigation";

import { getPrincipleById } from "@portfolio/db/queries";

import { deletePrincipleAction, updatePrincipleAction } from "@/app/actions";
import { DeleteForm } from "@/components/delete-form";
import { PrincipleForm } from "@/components/forms/principle-form";
import { ModalPanel } from "@/components/modal-panel";
import { PageTitle } from "@/components/page-title";
import { RecordOverview } from "@/components/record-overview";

export const dynamic = "force-dynamic";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPrinciplePage({ params }: EditPageProps) {
  const { id } = await params;
  const principle = await getPrincipleById(id);

  if (!principle) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-8 lg:px-8">
      <Link href="/content/principles" className="text-sm text-muted transition hover:text-ink">
        ← Back to principles
      </Link>
      <div className="mt-4">
        <PageTitle title="Edit principle" description="Update this operating principle." />
      </div>
      <RecordOverview
        title={principle.title}
        description={principle.summary}
        details={[
          { label: "Status", value: principle.status },
          { label: "Slug", value: principle.slug },
          { label: "Position", value: principle.position },
        ]}
        action={
          <ModalPanel
            triggerLabel="Edit principle"
            title="Edit principle"
            description="Make changes in the form, then confirm before saving."
            size="md"
          >
            <PrincipleForm
              action={updatePrincipleAction}
              title={principle.title}
              submitLabel="Save changes"
              defaults={principle}
            />
          </ModalPanel>
        }
      />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-white/[0.02] p-4">
        <p className="text-sm text-muted">Permanently remove this principle and its relationships.</p>
        <DeleteForm action={deletePrincipleAction} id={principle.id} label="Delete principle" />
      </div>
    </main>
  );
}
