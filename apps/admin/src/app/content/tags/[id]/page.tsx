import Link from "next/link";
import { notFound } from "next/navigation";

import { getTagById } from "@portfolio/db/queries";

import { deleteTagAction, updateTagAction } from "@/app/actions";
import { DeleteForm } from "@/components/delete-form";
import { TagForm } from "@/components/forms/tag-form";
import { ModalPanel } from "@/components/modal-panel";
import { PageTitle } from "@/components/page-title";
import { RecordOverview } from "@/components/record-overview";

export const dynamic = "force-dynamic";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTagPage({ params }: EditPageProps) {
  const { id } = await params;
  const tag = await getTagById(id);

  if (!tag) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-8 lg:px-8">
      <Link href="/content/tags" className="text-sm text-muted transition hover:text-ink">
        ← Back to tags
      </Link>
      <div className="mt-4">
        <PageTitle title="Edit tag" description="Update this tag." />
      </div>
      <RecordOverview
        title={tag.name}
        description={tag.slug}
        details={[
          { label: "Status", value: tag.status },
          { label: "Slug", value: tag.slug },
          { label: "Category", value: tag.category },
        ]}
        action={
          <ModalPanel
            triggerLabel="Edit tag"
            title="Edit tag"
            description="Make changes in the form, then confirm before saving."
            size="sm"
          >
            <TagForm
              action={updateTagAction}
              title={tag.name}
              submitLabel="Save changes"
              defaults={tag}
            />
          </ModalPanel>
        }
      />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-white/[0.02] p-4">
        <p className="text-sm text-muted">Permanently remove this tag and its relationships.</p>
        <DeleteForm action={deleteTagAction} id={tag.id} label="Delete tag" />
      </div>
    </main>
  );
}
