import { describe, expect, it } from "vitest";

import { resolveVisibleModelName } from "../src/ai-model-display";
import {
  createLlmConfigurationSchema,
  createPromptVersionSchema,
  extractTemplateVariables,
  PromptRenderError,
  renderPromptTemplate,
  renderWorkflowUserPrompt,
  validateTemplateForWorkflow,
} from "../src/llm-prompts";

const goodAiInsightsTemplate =
  "Produce the report.\n\nRESPONSE SHAPE:\n{{responseShape}}\n\nDATASET:\n{{dataset}}";

describe("template variable extraction", () => {
  it("returns distinct variables in first-seen order", () => {
    expect(extractTemplateVariables("{{a}} {{ b }} {{a}} {{c}}")).toEqual(["a", "b", "c"]);
  });
});

describe("validateTemplateForWorkflow", () => {
  it("accepts a template that uses exactly the required variables", () => {
    const result = validateTemplateForWorkflow("aiInsights", goodAiInsightsTemplate);
    expect(result.ok).toBe(true);
    expect(result.missingRequired).toEqual([]);
    expect(result.unknown).toEqual([]);
  });

  it("flags missing required variables", () => {
    const result = validateTemplateForWorkflow("aiInsights", "Only {{dataset}} here.");
    expect(result.ok).toBe(false);
    expect(result.missingRequired).toEqual(["responseShape"]);
  });

  it("flags unknown variables not in the workflow contract", () => {
    const result = validateTemplateForWorkflow(
      "aiInsights",
      "{{responseShape}} {{dataset}} {{secretBackdoor}}",
    );
    expect(result.ok).toBe(false);
    expect(result.unknown).toEqual(["secretBackdoor"]);
  });

  it("treats contentReview optional variables as allowed but not required", () => {
    const required = validateTemplateForWorkflow(
      "contentReview",
      "{{contentType}} {{contentRecord}} {{responseShape}}",
    );
    expect(required.ok).toBe(true);

    const withOptional = validateTemplateForWorkflow(
      "contentReview",
      "{{contentType}} {{contentRecord}} {{responseShape}} {{reviewCriteria}}",
    );
    expect(withOptional.ok).toBe(true);
    expect(withOptional.unknown).toEqual([]);
  });
});

describe("renderPromptTemplate", () => {
  it("substitutes only provided tokens and reports unresolved ones", () => {
    const { text, unresolved } = renderPromptTemplate("{{a}} and {{b}}", { a: "X" });
    expect(text).toBe("X and {{b}}");
    expect(unresolved).toEqual(["b"]);
  });

  it("does not interpret replacement values as templates (no code/template injection)", () => {
    const { text } = renderPromptTemplate("{{a}}", { a: "{{b}}", b: "SHOULD_NOT_APPEAR" });
    expect(text).toBe("{{b}}");
  });
});

describe("renderWorkflowUserPrompt", () => {
  it("renders when all required variables are supplied", () => {
    const text = renderWorkflowUserPrompt("aiInsights", goodAiInsightsTemplate, {
      responseShape: "{json}",
      dataset: "{records}",
    });
    expect(text).toContain("{json}");
    expect(text).toContain("{records}");
  });

  it("throws PromptRenderError when a required variable is absent", () => {
    expect(() =>
      renderWorkflowUserPrompt("aiInsights", goodAiInsightsTemplate, { dataset: "x" }),
    ).toThrow(PromptRenderError);
  });
});

describe("createPromptVersionSchema", () => {
  const base = {
    workflow: "aiInsights",
    version: "v1",
    name: "Default",
    systemPrompt: "You are an analyst.",
    userPromptTemplate: goodAiInsightsTemplate,
  };

  it("accepts a valid prompt version", () => {
    expect(createPromptVersionSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a template missing a required variable", () => {
    const result = createPromptVersionSchema.safeParse({
      ...base,
      userPromptTemplate: "Only {{dataset}}",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a template with an unknown variable", () => {
    const result = createPromptVersionSchema.safeParse({
      ...base,
      userPromptTemplate: "{{responseShape}} {{dataset}} {{rogue}}",
    });
    expect(result.success).toBe(false);
  });
});

describe("createLlmConfigurationSchema", () => {
  const base = { workflow: "aiInsights", provider: "custom", model: "gemma" };

  it("applies structured defaults", () => {
    const parsed = createLlmConfigurationSchema.parse(base);
    expect(parsed.temperature).toBe(0.2);
    expect(parsed.topP).toBe(0.9);
    expect(parsed.maxTokens).toBe(12000);
    expect(parsed.maxRetries).toBe(2);
    expect(parsed.timeoutMs).toBeNull();
  });

  it("rejects out-of-range temperature, topP, and maxRetries", () => {
    expect(createLlmConfigurationSchema.safeParse({ ...base, temperature: 1.5 }).success).toBe(false);
    expect(createLlmConfigurationSchema.safeParse({ ...base, topP: -0.1 }).success).toBe(false);
    expect(createLlmConfigurationSchema.safeParse({ ...base, maxRetries: 9 }).success).toBe(false);
  });

  it("allows maxTokens 0 (unlimited) but rejects negative", () => {
    expect(createLlmConfigurationSchema.safeParse({ ...base, maxTokens: 0 }).success).toBe(true);
    expect(createLlmConfigurationSchema.safeParse({ ...base, maxTokens: -1 }).success).toBe(false);
  });

  it("rejects a non-positive timeoutMs when provided", () => {
    expect(createLlmConfigurationSchema.safeParse({ ...base, timeoutMs: 0 }).success).toBe(false);
    expect(createLlmConfigurationSchema.safeParse({ ...base, timeoutMs: 5000 }).success).toBe(true);
  });
});

describe("resolveVisibleModelName", () => {
  it("prefers the curated visible name and never exposes the raw id alongside it", () => {
    expect(
      resolveVisibleModelName({ visibleModelName: "Gemma (Local)", provider: "custom", model: "gemma-31b-q4" }),
    ).toBe("Gemma (Local)");
  });

  it("falls back to model, then provider, then 'AI model'", () => {
    expect(resolveVisibleModelName({ provider: "custom", model: "gemma-31b" })).toBe("gemma-31b");
    expect(resolveVisibleModelName({ provider: "custom" })).toBe("custom");
    expect(resolveVisibleModelName({})).toBe("AI model");
  });
});
