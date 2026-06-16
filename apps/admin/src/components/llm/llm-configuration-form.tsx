"use client";

import { useActionState } from "react";

import {
  LLM_CONFIGURATION_DEFAULTS,
  LLM_WORKFLOW_LABELS,
  LLM_WORKFLOWS,
  type LlmWorkflow,
} from "@portfolio/validators";

import type { LlmConfigurationFormState } from "@/app/llm-settings/configurations/actions";

type Action = (
  state: LlmConfigurationFormState,
  formData: FormData,
) => Promise<LlmConfigurationFormState>;

interface LlmConfigurationFormProps {
  action: Action;
  submitLabel: string;
  initial?: {
    id?: string;
    workflow?: LlmWorkflow;
    provider?: string;
    model?: string;
    visibleModelName?: string | null;
    baseUrl?: string | null;
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    maxRetries?: number;
    timeoutMs?: number | null;
    isActive?: boolean;
  };
}

const initialState: LlmConfigurationFormState = { status: "idle", message: "" };

export function LlmConfigurationForm({ action, submitLabel, initial }: LlmConfigurationFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-5">
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="ui-field">
          <span className="ui-label">
            Workflow <span className="ui-required">*</span>
          </span>
          <select name="workflow" className="ui-select" defaultValue={initial?.workflow ?? "aiInsights"}>
            {LLM_WORKFLOWS.map((value) => (
              <option key={value} value={value}>
                {LLM_WORKFLOW_LABELS[value]}
              </option>
            ))}
          </select>
        </label>

        <label className="ui-field">
          <span className="ui-label">
            Provider <span className="ui-required">*</span>
          </span>
          <input
            name="provider"
            className="ui-input"
            defaultValue={initial?.provider ?? ""}
            placeholder="custom, openai, anthropic, deepseek"
            required
          />
        </label>

        <label className="ui-field">
          <span className="ui-label">
            Model <span className="ui-required">*</span>
          </span>
          <input name="model" className="ui-input" defaultValue={initial?.model ?? ""} required />
        </label>

        <label className="ui-field">
          <span className="ui-label">Visible model name</span>
          <input
            name="visibleModelName"
            className="ui-input"
            defaultValue={initial?.visibleModelName ?? ""}
            placeholder="Shown in UI instead of the raw model id"
          />
        </label>
      </div>

      <label className="ui-field">
        <span className="ui-label">Base URL</span>
        <input
          name="baseUrl"
          className="ui-input"
          defaultValue={initial?.baseUrl ?? ""}
          placeholder="Optional override (else .env base URL is used)"
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <label className="ui-field">
          <span className="ui-label">Temperature (0–1)</span>
          <input
            name="temperature"
            type="number"
            step="0.01"
            min="0"
            max="1"
            className="ui-input"
            defaultValue={initial?.temperature ?? LLM_CONFIGURATION_DEFAULTS.temperature}
          />
        </label>
        <label className="ui-field">
          <span className="ui-label">topP (0–1)</span>
          <input
            name="topP"
            type="number"
            step="0.01"
            min="0"
            max="1"
            className="ui-input"
            defaultValue={initial?.topP ?? LLM_CONFIGURATION_DEFAULTS.topP}
          />
        </label>
        <label className="ui-field">
          <span className="ui-label">maxTokens (0 = unlimited)</span>
          <input
            name="maxTokens"
            type="number"
            step="1"
            min="0"
            className="ui-input"
            defaultValue={initial?.maxTokens ?? LLM_CONFIGURATION_DEFAULTS.maxTokens}
          />
        </label>
        <label className="ui-field">
          <span className="ui-label">maxRetries (0–5)</span>
          <input
            name="maxRetries"
            type="number"
            step="1"
            min="0"
            max="5"
            className="ui-input"
            defaultValue={initial?.maxRetries ?? LLM_CONFIGURATION_DEFAULTS.maxRetries}
          />
        </label>
        <label className="ui-field">
          <span className="ui-label">timeoutMs (optional)</span>
          <input
            name="timeoutMs"
            type="number"
            step="1"
            min="1"
            className="ui-input"
            defaultValue={initial?.timeoutMs ?? ""}
            placeholder="Blank uses the default"
          />
        </label>
      </div>

      <label className="ui-row items-center gap-2">
        <input
          type="checkbox"
          name="isActive"
          className="ui-checkbox"
          defaultChecked={initial?.isActive ?? false}
        />
        <span className="ui-label !mb-0">Active (deactivates any other config for this workflow)</span>
      </label>

      {state.status === "error" ? <p className="ui-error">{state.message}</p> : null}

      <div className="flex gap-3">
        <button type="submit" className="ui-btn-primary" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </button>
        <a href="/llm-settings/configurations" className="ui-btn-secondary">
          Cancel
        </a>
      </div>
    </form>
  );
}
