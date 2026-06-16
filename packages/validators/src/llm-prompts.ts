import { z } from "zod";

/**
 * LLM workflows that can be driven by a DB-managed prompt version and/or
 * configuration. The variable contract for each workflow lives in CODE (below),
 * never in the database — the DB only stores prompt *text*.
 */
export const LLM_WORKFLOWS = [
  "aiInsights",
  "contentReview",
  "taxonomyReview",
  "relationReview",
] as const;

export type LlmWorkflow = (typeof LLM_WORKFLOWS)[number];

export function isLlmWorkflow(value: unknown): value is LlmWorkflow {
  return typeof value === "string" && (LLM_WORKFLOWS as readonly string[]).includes(value);
}

/** Human-readable labels for the admin UI. */
export const LLM_WORKFLOW_LABELS: Record<LlmWorkflow, string> = {
  aiInsights: "AI Insights",
  contentReview: "Content Review",
  taxonomyReview: "Taxonomy Review",
  relationReview: "Relation Review",
};

/**
 * The variable contract per workflow. `required` template variables MUST appear
 * in a prompt's `userPromptTemplate` before it can be saved/activated, and MUST
 * be supplied at render time. `optional` variables may appear but are not
 * mandatory. Any `{{variable}}` not listed here is "unknown" and is rejected
 * before activation.
 *
 * This is the single source of truth — the admin UI reads it to show available
 * variables, and the runtime reads it to validate render inputs.
 */
export const LLM_PROMPT_VARIABLES = {
  aiInsights: {
    required: ["responseShape", "dataset"],
    optional: [],
  },
  taxonomyReview: {
    required: ["responseShape", "dataset"],
    optional: [],
  },
  contentReview: {
    required: ["contentRecord", "responseShape"],
    optional: ["reviewCriteria"],
  },
  relationReview: {
    required: ["responseShape", "dataset"],
    optional: [],
  },
} as const satisfies Record<LlmWorkflow, { required: readonly string[]; optional: readonly string[] }>;

export interface WorkflowVariableContract {
  required: readonly string[];
  optional: readonly string[];
}

export function getWorkflowVariableContract(workflow: LlmWorkflow): WorkflowVariableContract {
  return LLM_PROMPT_VARIABLES[workflow];
}

/** Every variable a workflow's template is allowed to reference. */
export function getAllowedWorkflowVariables(workflow: LlmWorkflow): string[] {
  const contract = getWorkflowVariableContract(workflow);
  return [...contract.required, ...contract.optional];
}

/** Matches `{{ variableName }}` (whitespace-tolerant, alphanumeric + underscore). */
const TEMPLATE_VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

/** Distinct template variable names referenced by a template, in first-seen order. */
export function extractTemplateVariables(template: string): string[] {
  const found: string[] = [];
  for (const match of template.matchAll(TEMPLATE_VARIABLE_PATTERN)) {
    const name = match[1];
    if (name && !found.includes(name)) {
      found.push(name);
    }
  }
  return found;
}

export interface TemplateValidationResult {
  ok: boolean;
  /** Required variables the template never references. */
  missingRequired: string[];
  /** `{{variables}}` referenced by the template that the workflow does not allow. */
  unknown: string[];
  /** Allowed variables actually used (required + optional). */
  used: string[];
}

/**
 * Static validation of a template against a workflow's variable contract —
 * used at save/activate time and for admin warnings. Pure string analysis; no
 * code evaluation.
 */
export function validateTemplateForWorkflow(
  workflow: LlmWorkflow,
  template: string,
): TemplateValidationResult {
  const contract = getWorkflowVariableContract(workflow);
  const allowed = new Set<string>([...contract.required, ...contract.optional]);
  const used = extractTemplateVariables(template);

  const missingRequired = contract.required.filter((name) => !used.includes(name));
  const unknown = used.filter((name) => !allowed.has(name));

  return {
    ok: missingRequired.length === 0 && unknown.length === 0,
    missingRequired,
    unknown,
    used: used.filter((name) => allowed.has(name)),
  };
}

export interface RenderPromptResult {
  text: string;
  /** `{{variables}}` left in the template because no value was provided. */
  unresolved: string[];
}

/**
 * Safe template rendering: replaces `{{variable}}` tokens with provided string
 * values via plain string substitution. There is NO code evaluation and NO
 * interpolation of arbitrary expressions — only the exact token set is touched.
 * Tokens without a provided value are left intact and reported as `unresolved`.
 */
export function renderPromptTemplate(
  template: string,
  values: Record<string, string>,
): RenderPromptResult {
  const unresolved: string[] = [];
  const text = template.replace(TEMPLATE_VARIABLE_PATTERN, (match, rawName: string) => {
    const name = rawName.trim();
    if (Object.prototype.hasOwnProperty.call(values, name)) {
      return values[name] ?? "";
    }
    if (!unresolved.includes(name)) {
      unresolved.push(name);
    }
    return match;
  });
  return { text, unresolved };
}

export class PromptRenderError extends Error {
  constructor(
    message: string,
    public readonly missing: string[],
  ) {
    super(message);
    this.name = "PromptRenderError";
  }
}

/**
 * Render a workflow's user prompt, enforcing that every required variable was
 * supplied. Throws {@link PromptRenderError} when a required variable is missing
 * so a run fails closed rather than sending a half-filled prompt to the model.
 */
export function renderWorkflowUserPrompt(
  workflow: LlmWorkflow,
  template: string,
  values: Record<string, string>,
): string {
  const contract = getWorkflowVariableContract(workflow);
  const missing = contract.required.filter(
    (name) => !Object.prototype.hasOwnProperty.call(values, name),
  );
  if (missing.length > 0) {
    throw new PromptRenderError(
      `Cannot render ${workflow} prompt — missing required variable(s): ${missing.join(", ")}.`,
      missing,
    );
  }
  return renderPromptTemplate(template, values).text;
}

// ---------------------------------------------------------------------------
// Zod input schemas for the admin CRUD actions.
// ---------------------------------------------------------------------------

const trimmedRequired = (label: string, max = 200) =>
  z.string().trim().min(1, `${label} is required.`).max(max);

const emptyToNull = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export const llmWorkflowSchema = z.enum(LLM_WORKFLOWS);

const promptVersionBaseSchema = z.object({
  workflow: llmWorkflowSchema,
  version: trimmedRequired("Version", 60),
  name: trimmedRequired("Name", 200),
  description: z.preprocess(emptyToNull, z.string().trim().max(2000).nullable().default(null)),
  systemPrompt: trimmedRequired("System prompt", 50000),
  userPromptTemplate: trimmedRequired("User prompt template", 50000),
  isActive: z.coerce.boolean().default(false),
});

/**
 * Reject templates whose required variables are missing or that reference
 * unknown variables, attaching the failure to `userPromptTemplate`.
 */
const enforceTemplateContract = (
  value: { workflow: LlmWorkflow; userPromptTemplate: string },
  ctx: z.RefinementCtx,
): void => {
  const result = validateTemplateForWorkflow(value.workflow, value.userPromptTemplate);
  if (result.missingRequired.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["userPromptTemplate"],
      message: `Missing required variable(s): ${result.missingRequired
        .map((name) => `{{${name}}}`)
        .join(", ")}.`,
    });
  }
  if (result.unknown.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["userPromptTemplate"],
      message: `Unknown variable(s) for this workflow: ${result.unknown
        .map((name) => `{{${name}}}`)
        .join(", ")}.`,
    });
  }
};

export const createPromptVersionSchema = promptVersionBaseSchema.superRefine(
  enforceTemplateContract,
);

export const updatePromptVersionSchema = promptVersionBaseSchema
  .extend({ id: z.string().uuid() })
  .superRefine(enforceTemplateContract);

export type CreatePromptVersionInput = z.infer<typeof createPromptVersionSchema>;
export type UpdatePromptVersionInput = z.infer<typeof updatePromptVersionSchema>;

/** Structured-generation defaults for a brand-new configuration row. */
export const LLM_CONFIGURATION_DEFAULTS = {
  temperature: 0.2,
  topP: 0.9,
  maxTokens: 0,
  maxRetries: 2,
} as const;

const temperatureSchema = z.coerce
  .number()
  .min(0, "Temperature must be between 0 and 1.")
  .max(1, "Temperature must be between 0 and 1.");
const topPSchema = z.coerce
  .number()
  .min(0, "topP must be between 0 and 1.")
  .max(1, "topP must be between 0 and 1.");
/** 0 means "unlimited" (no completion cap sent to the provider). */
const maxTokensSchema = z.coerce
  .number()
  .int("maxTokens must be a whole number.")
  .min(0, "maxTokens must be 0 (unlimited) or greater.");
const maxRetriesSchema = z.coerce
  .number()
  .int("maxRetries must be a whole number.")
  .min(0, "maxRetries must be between 0 and 5.")
  .max(5, "maxRetries must be between 0 and 5.");
const timeoutMsSchema = z.preprocess(
  emptyToNull,
  z.coerce.number().int().positive("timeoutMs must be a positive number.").nullable().default(null),
);

export const llmConfigurationSchema = z.object({
  workflow: llmWorkflowSchema,
  provider: trimmedRequired("Provider", 120),
  model: trimmedRequired("Model", 220),
  visibleModelName: z.preprocess(
    emptyToNull,
    z.string().trim().max(200).nullable().default(null),
  ),
  baseUrl: z.preprocess(emptyToNull, z.string().trim().max(2048).nullable().default(null)),
  temperature: temperatureSchema.default(LLM_CONFIGURATION_DEFAULTS.temperature),
  topP: topPSchema.default(LLM_CONFIGURATION_DEFAULTS.topP),
  maxTokens: maxTokensSchema.default(LLM_CONFIGURATION_DEFAULTS.maxTokens),
  maxRetries: maxRetriesSchema.default(LLM_CONFIGURATION_DEFAULTS.maxRetries),
  timeoutMs: timeoutMsSchema,
  isActive: z.coerce.boolean().default(false),
});

export const createLlmConfigurationSchema = llmConfigurationSchema;
export const updateLlmConfigurationSchema = llmConfigurationSchema.extend({
  id: z.string().uuid(),
});

export type LlmConfigurationInput = z.infer<typeof llmConfigurationSchema>;
export type UpdateLlmConfigurationInput = z.infer<typeof updateLlmConfigurationSchema>;
