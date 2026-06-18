import {
  renderPromptTemplate,
  renderWorkflowUserPrompt,
  type LlmWorkflow,
} from "@portfolio/validators";

/**
 * Minimal shape of an active DB prompt version the resolver needs. Kept narrow
 * (not the full DB row) so this module stays dependency-pure and unit-testable.
 */
export interface ActivePromptVersionLike {
  id: string;
  version: string;
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
}

export interface ResolvedWorkflowPrompt {
  system: string;
  user: string;
  /** Where the prompt came from — persisted on the run for provenance. */
  source: "db";
  promptVersionId: string;
  promptVersion: string;
  promptName: string;
}

export interface ResolveWorkflowPromptParams {
  workflow: LlmWorkflow;
  /** The active DB prompt version. */
  activeVersion: ActivePromptVersionLike;
  /** Values for the workflow's template variables (e.g. responseShape, dataset). */
  variables: Record<string, string>;
}

/**
 * Resolve the system + user prompt for a workflow run:
 * An active DB prompt version is rendered with the supplied variables. The
 * caller is responsible for validating the workflow variable contract first.
 *
 * The returned `source`/`promptVersion*` fields are persisted on the run so the
 * audit log always records which prompt produced an output. Pure: the active
 * version is injected by the caller.
 */
export function resolveWorkflowPrompt(
  params: ResolveWorkflowPromptParams,
): ResolvedWorkflowPrompt {
  const { workflow, activeVersion, variables } = params;
  return {
    system: renderPromptTemplate(activeVersion.systemPrompt, variables).text,
    user: renderWorkflowUserPrompt(workflow, activeVersion.userPromptTemplate, variables),
    source: "db",
    promptVersionId: activeVersion.id,
    promptVersion: activeVersion.version,
    promptName: activeVersion.name,
  };
}
