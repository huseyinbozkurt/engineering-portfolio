import { notFound } from "next/navigation";

import { getLlmConfiguration } from "@portfolio/db/llm-configurations";

import { PageTitle } from "@/components/page-title";
import { LlmConfigurationForm } from "@/components/llm/llm-configuration-form";
import { updateLlmConfigurationAction } from "../actions";

export const dynamic = "force-dynamic";

interface EditLlmConfigurationPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLlmConfigurationPage({ params }: EditLlmConfigurationPageProps) {
  const { id } = await params;
  const config = await getLlmConfiguration(id);

  if (!config) {
    notFound();
  }

  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle title="Edit LLM Configuration" description="Update the provider, model, or sampling settings." />
      <div className="ui-card max-w-3xl p-6 shadow-card">
        <LlmConfigurationForm
          action={updateLlmConfigurationAction}
          submitLabel="Save changes"
          initial={{
            id: config.id,
            workflow: config.workflow,
            provider: config.provider,
            model: config.model,
            visibleModelName: config.visibleModelName,
            baseUrl: config.baseUrl,
            temperature: config.temperature,
            topP: config.topP,
            maxTokens: config.maxTokens,
            maxRetries: config.maxRetries,
            timeoutMs: config.timeoutMs,
            isActive: config.isActive,
          }}
        />
      </div>
    </main>
  );
}
