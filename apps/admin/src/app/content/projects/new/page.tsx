import { Plus } from "lucide-react";

import { createProjectDraftAction } from "@/app/actions";
import { PageTitle } from "@/components/page-title";

export const dynamic = "force-dynamic";

export default function NewProjectPage() {
  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title="New Project"
        description="Create a draft first, then edit, preview, and publish it."
        actions={
          <form action={createProjectDraftAction}>
            <button type="submit" className="ui-btn-primary">
              <Plus className="size-4" aria-hidden /> Create Draft
            </button>
          </form>
        }
      />
    </main>
  );
}
