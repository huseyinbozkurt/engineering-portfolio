"use client";

import { useActionState, useState } from "react";

import {
  LLM_PROMPT_VARIABLES,
  LLM_WORKFLOW_LABELS,
  LLM_WORKFLOWS,
  validateTemplateForWorkflow,
  type LlmWorkflow,
} from "@portfolio/validators";

import type { PromptVersionFormState } from "@/app/llm-settings/prompts/actions";

type Action = (state: PromptVersionFormState, formData: FormData) => Promise<PromptVersionFormState>;

interface PromptVersionFormProps {
  action: Action;
  submitLabel: string;
  initial?: {
    id?: string;
    workflow?: LlmWorkflow;
    version?: string;
    name?: string;
    description?: string | null;
    systemPrompt?: string;
    userPromptTemplate?: string;
    isActive?: boolean;
  };
}

const initialState: PromptVersionFormState = { status: "idle", message: "" };

export function PromptVersionForm({ action, submitLabel, initial }: PromptVersionFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [workflow, setWorkflow] = useState<LlmWorkflow>(initial?.workflow ?? "aiInsights");
  const [template, setTemplate] = useState(initial?.userPromptTemplate ?? "");

  const contract = LLM_PROMPT_VARIABLES[workflow];
  const validation = validateTemplateForWorkflow(workflow, template);

  return (
    <form action={formAction} className="grid gap-5">
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="ui-field">
          <span className="ui-label">
            Workflow <span className="ui-required">*</span>
          </span>
          <select
            name="workflow"
            className="ui-select"
            value={workflow}
            onChange={(event) => setWorkflow(event.target.value as LlmWorkflow)}
          >
            {LLM_WORKFLOWS.map((value) => (
              <option key={value} value={value}>
                {LLM_WORKFLOW_LABELS[value]}
              </option>
            ))}
          </select>
        </label>

        <label className="ui-field">
          <span className="ui-label">
            Version <span className="ui-required">*</span>
          </span>
          <input name="version" className="ui-input" defaultValue={initial?.version ?? ""} required />
        </label>
      </div>

      <label className="ui-field">
        <span className="ui-label">
          Name <span className="ui-required">*</span>
        </span>
        <input name="name" className="ui-input" defaultValue={initial?.name ?? ""} required />
      </label>

      <label className="ui-field">
        <span className="ui-label">Description</span>
        <input
          name="description"
          className="ui-input"
          defaultValue={initial?.description ?? ""}
          placeholder="Optional note about this version."
        />
      </label>

      <div className="ui-card border-line bg-white/[0.02] p-4">
        <p className="ui-label mb-2">Available variables for {LLM_WORKFLOW_LABELS[workflow]}</p>
        <div className="flex flex-wrap gap-2">
          {contract.required.map((name) => (
            <span key={name} className="ui-badge-accent" title="Required">
              {`{{${name}}}`} <span className="ui-required">*</span>
            </span>
          ))}
          {contract.optional.map((name) => (
            <span key={name} className="ui-badge-neutral" title="Optional">
              {`{{${name}}}`}
            </span>
          ))}
        </div>
        <p className="ui-hint mt-2">
          Required variables (marked <span className="ui-required">*</span>) must appear in the user
          template. Unknown variables are rejected on save.
        </p>
      </div>

      <label className="ui-field">
        <span className="ui-label">
          System prompt <span className="ui-required">*</span>
        </span>
        <textarea
          name="systemPrompt"
          className="ui-input min-h-32 font-mono text-xs"
          defaultValue={initial?.systemPrompt ?? ""}
          required
        />
      </label>

      <label className="ui-field">
        <span className="ui-label">
          User prompt template <span className="ui-required">*</span>
        </span>
        <textarea
          name="userPromptTemplate"
          className="ui-input min-h-48 font-mono text-xs"
          value={template}
          onChange={(event) => setTemplate(event.target.value)}
          required
        />
        {validation.missingRequired.length > 0 ? (
          <span className="ui-error">
            Missing required: {validation.missingRequired.map((n) => `{{${n}}}`).join(", ")}
          </span>
        ) : null}
        {validation.unknown.length > 0 ? (
          <span className="ui-error">
            Unknown variable(s): {validation.unknown.map((n) => `{{${n}}}`).join(", ")}
          </span>
        ) : null}
        {validation.ok ? <span className="ui-hint">Template satisfies the variable contract.</span> : null}
      </label>

      <label className="ui-row items-center gap-2">
        <input
          type="checkbox"
          name="isActive"
          className="ui-checkbox"
          defaultChecked={initial?.isActive ?? false}
        />
        <span className="ui-label !mb-0">Active (deactivates any other version for this workflow)</span>
      </label>

      {state.status === "error" ? <p className="ui-error">{state.message}</p> : null}

      <div className="flex gap-3">
        <button type="submit" className="ui-btn-primary" disabled={pending || !validation.ok}>
          {pending ? "Saving…" : submitLabel}
        </button>
        <a href="/llm-settings/prompts" className="ui-btn-secondary">
          Cancel
        </a>
      </div>
    </form>
  );
}
