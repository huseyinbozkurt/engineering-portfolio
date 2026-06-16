import { PageTitle } from "@/components/page-title";
import { PromptVersionForm } from "@/components/llm/prompt-version-form";
import { createPromptVersionAction } from "../actions";

export default function NewPromptVersionPage() {
  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title="New Prompt Version"
        description="Author a DB-managed prompt for a workflow. The user template must include the workflow's required variables."
      />
      <div className="ui-card max-w-3xl p-6 shadow-card">
        <PromptVersionForm action={createPromptVersionAction} submitLabel="Create version" />
      </div>
    </main>
  );
}
