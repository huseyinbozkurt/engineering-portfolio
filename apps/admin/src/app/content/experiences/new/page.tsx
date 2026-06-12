import { Plus } from "lucide-react";

import { createExperienceDraftAction } from "@/app/actions";
import { PageTitle } from "@/components/page-title";

export const dynamic = "force-dynamic";

export default function NewExperiencePage() {
  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title="New Experience"
        description="Create a draft first, then edit, preview, and publish it."
        actions={
          <form action={createExperienceDraftAction}>
            <button type="submit" className="ui-btn-primary">
              <Plus className="size-4" aria-hidden /> Create Draft
            </button>
          </form>
        }
      />
    </main>
  );
}
