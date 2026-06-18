import { notFound } from "next/navigation";

import { getLlmPromptVersion } from "@portfolio/db/llm-prompt-versions";

import { PageTitle } from "@/components/page-title";
import { PromptVersionForm } from "@/components/llm/prompt-version-form";
import { updatePromptVersionAction } from "../actions";

export const dynamic = "force-dynamic";

interface EditPromptVersionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPromptVersionPage({ params }: EditPromptVersionPageProps) {
  const { id } = await params;
  const version = await getLlmPromptVersion(id);

  if (!version) {
    notFound();
  }

  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title="Edit Prompt Version"
        description="Update the prompt text or activation. Required variables are enforced before saving."
      />
      <div className="ui-card max-w-3xl p-6 shadow-card">
        <PromptVersionForm
          action={updatePromptVersionAction}
          submitLabel="Save changes"
          initial={{
            id: version.id,
            workflow: version.workflow,
            targetType: version.targetType,
            version: version.version,
            name: version.name,
            description: version.description,
            systemPrompt: version.systemPrompt,
            userPromptTemplate: version.userPromptTemplate,
            isActive: version.isActive,
          }}
        />
      </div>
    </main>
  );
}
