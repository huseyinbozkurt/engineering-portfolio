import { PageTitle } from "@/components/page-title";
import { LlmConfigurationForm } from "@/components/llm/llm-configuration-form";
import { createLlmConfigurationAction } from "../actions";

export default function NewLlmConfigurationPage() {
  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title="New LLM Configuration"
        description="Define the provider, model, and sampling settings for a workflow."
      />
      <div className="ui-card max-w-3xl p-6 shadow-card">
        <LlmConfigurationForm action={createLlmConfigurationAction} submitLabel="Create configuration" />
      </div>
    </main>
  );
}
