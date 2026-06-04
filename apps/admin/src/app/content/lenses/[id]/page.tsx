import Link from "next/link";
import { notFound } from "next/navigation";

import { getLensById } from "@portfolio/db/queries";

import { deleteLensAction, updateLensAction } from "@/app/actions";
import { DeleteForm } from "@/components/delete-form";
import { LensForm } from "@/components/forms/lens-form";
import { ModalPanel } from "@/components/modal-panel";
import { PageTitle } from "@/components/page-title";
import { RecordOverview } from "@/components/record-overview";

export const dynamic = "force-dynamic";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLensPage({ params }: EditPageProps) {
  const { id } = await params;
  const lens = await getLensById(id);

  if (!lens) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-8 lg:px-8">
      <Link href="/content/lenses" className="text-sm text-muted transition hover:text-ink">
        ← Back to lenses
      </Link>
      <div className="mt-4">
        <PageTitle title="Edit lens" description="Update this lens and control its visibility." />
      </div>
      <RecordOverview
        title={lens.name}
        description={lens.summary}
        details={[
          { label: "Status", value: lens.status },
          { label: "Slug", value: lens.slug },
          { label: "Accent color", value: lens.accentColor },
          { label: "Position", value: lens.position },
        ]}
        action={
          <ModalPanel
            triggerLabel="Edit lens"
            title="Edit lens"
            description="Make changes in the form, then confirm before saving."
            size="md"
          >
            <LensForm
              action={updateLensAction}
              title={lens.name}
              submitLabel="Save changes"
              defaults={lens}
            />
          </ModalPanel>
        }
      />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-white/[0.02] p-4">
        <p className="text-sm text-muted">Permanently remove this lens and its relationships.</p>
        <DeleteForm action={deleteLensAction} id={lens.id} label="Delete lens" />
      </div>
    </main>
  );
}
