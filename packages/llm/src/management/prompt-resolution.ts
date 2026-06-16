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
  source: "db" | "codeFallback";
  promptVersionId: string | null;
  promptVersion: string | null;
  promptName: string | null;
}

export interface ResolveWorkflowPromptParams {
  workflow: LlmWorkflow;
  /** The active DB prompt version, or null to use the hardcoded fallback. */
  activeVersion: ActivePromptVersionLike | null;
  /** Values for the workflow's template variables (e.g. responseShape, dataset). */
  variables: Record<string, string>;
  /** The hardcoded prompt builder, used when no active DB version exists. */
  fallback: () => { system: string; user: string };
}

/**
 * Resolve the system + user prompt for a workflow run:
 *   1. An active DB prompt version is rendered with the supplied variables
 *      (the user template is contract-validated; missing required variables
 *      throw before a half-filled prompt reaches the model).
 *   2. Otherwise the hardcoded prompt builder is used.
 *
 * The returned `source`/`promptVersion*` fields are persisted on the run so the
 * audit log always records which prompt produced an output. Pure: the active
 * version and fallback are injected by the caller.
 */
export function resolveWorkflowPrompt(
  params: ResolveWorkflowPromptParams,
): ResolvedWorkflowPrompt {
  const { workflow, activeVersion, variables, fallback } = params;

  if (activeVersion) {
    return {
      // The system prompt is used as-is but may also reference variables; the
      // user prompt is the required-variable-validated template.
      system: renderPromptTemplate(activeVersion.systemPrompt, variables).text,
      user: renderWorkflowUserPrompt(workflow, activeVersion.userPromptTemplate, variables),
      source: "db",
      promptVersionId: activeVersion.id,
      promptVersion: activeVersion.version,
      promptName: activeVersion.name,
    };
  }

  const built = fallback();
  return {
    system: built.system,
    user: built.user,
    source: "codeFallback",
    promptVersionId: null,
    promptVersion: null,
    promptName: null,
  };
}
