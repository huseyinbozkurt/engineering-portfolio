import { getTags } from "@portfolio/db/queries";

import { bulkUpsertTagsAction, createTagAction } from "@/app/actions";
import { ContentList } from "@/components/content-list";
import { BulkTaxonomyForm } from "@/components/forms/bulk-taxonomy-form";
import { TagForm } from "@/components/forms/tag-form";
import { ModalPanel } from "@/components/modal-panel";
import { PageTitle } from "@/components/page-title";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const tags = await getTags();

  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title="Tags"
        description="Tags provide lightweight categorization across projects, experience, and case studies."
        actions={
          <>
            <ModalPanel
              triggerLabel="Create tag"
              title="Create tag"
              description="Add a new tag and confirm before saving it."
              size="sm"
            >
              <TagForm action={createTagAction} title="Create tag" submitLabel="Create Tag" />
            </ModalPanel>
            <ModalPanel
              triggerLabel="Bulk edit"
              title="Bulk create or edit tags"
              description="Paste tag rows, then confirm before saving all changes."
              size="md"
              triggerVariant="secondary"
            >
              <BulkTaxonomyForm
                action={bulkUpsertTagsAction}
                title="Bulk create or edit tags"
                fieldGuide="One row per tag. Use: name | slug | category | status. Existing slugs are updated; new slugs are created."
                defaultValue={serializeTags(tags)}
                placeholder="Platform | platform | Domain | published"
                submitLabel="Save Tags In Bulk"
              />
            </ModalPanel>
          </>
        }
      />
      <ContentList
        title="Existing tags"
        emptyTitle="No tags yet"
        emptyDescription="Tags will appear here after real records are created."
        items={tags.map((tag) => ({
          id: tag.id,
          title: tag.name,
          description: tag.slug,
          group: tag.category,
          status: tag.status,
          editHref: `/content/tags/${tag.id}`,
        }))}
      />
    </main>
  );
}

function serializeTags(tags: Awaited<ReturnType<typeof getTags>>): string {
  return tags
    .map((tag) => [tag.name, tag.slug, tag.category ?? "", tag.status].join(" | "))
    .join("\n");
}
