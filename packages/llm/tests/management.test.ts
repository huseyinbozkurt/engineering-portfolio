import { describe, expect, it } from "vitest";

import { STRUCTURED_JSON_GENERATION } from "../src/adapters/generation";
import { resolveWorkflowConfig } from "../src/management/config-resolution";
import { resolveWorkflowPrompt } from "../src/management/prompt-resolution";

describe("resolveWorkflowPrompt", () => {
  it("renders the active DB prompt version and records provenance", () => {
    const resolved = resolveWorkflowPrompt({
      workflow: "aiInsights",
      activeVersion: {
        id: "ver-1",
        version: "v2",
        name: "Tuned insights",
        systemPrompt: "You are an analyst.",
        userPromptTemplate: "SHAPE:\n{{responseShape}}\nDATA:\n{{dataset}}",
      },
      variables: { responseShape: "{schema}", dataset: "{records}" },
    });

    expect(resolved.source).toBe("db");
    expect(resolved.promptVersionId).toBe("ver-1");
    expect(resolved.promptVersion).toBe("v2");
    expect(resolved.promptName).toBe("Tuned insights");
    expect(resolved.user).toBe("SHAPE:\n{schema}\nDATA:\n{records}");
    expect(resolved.system).toBe("You are an analyst.");
  });

  it("throws when a required variable value is missing at render time", () => {
    // `dataset` is the required aiInsights variable (responseShape is now optional).
    expect(() =>
      resolveWorkflowPrompt({
        workflow: "aiInsights",
        activeVersion: {
          id: "ver-1",
          version: "v1",
          name: "Broken",
          systemPrompt: "sys",
          userPromptTemplate: "needs {{dataset}}",
        },
        variables: { responseShape: "x" },
      }),
    ).toThrow(/dataset/);
  });
});

describe("resolveWorkflowConfig", () => {
  it("uses the active DB config and maps its sampling values", () => {
    const resolved = resolveWorkflowConfig({
      id: "cfg-1",
      provider: "custom",
      model: "gemma-31b",
      visibleModelName: "Gemma (Local)",
      baseUrl: "http://localhost:8000",
      temperature: 0.3,
      topP: 0.8,
      maxTokens: 20000,
      maxRetries: 3,
      timeoutMs: 600000,
    });

    expect(resolved.source).toBe("db");
    expect(resolved.configurationId).toBe("cfg-1");
    expect(resolved.visibleModelName).toBe("Gemma (Local)");
    expect(resolved.maxRetries).toBe(3);
    expect(resolved.generation).toEqual({ temperature: 0.3, topP: 0.8, maxTokens: 20000 });
  });

  it("treats maxTokens 0 as unlimited (no explicit cap in generation)", () => {
    const resolved = resolveWorkflowConfig({
      id: "cfg-2",
      provider: "custom",
      model: "gemma",
      visibleModelName: null,
      baseUrl: null,
      temperature: 0.2,
      topP: 0.9,
      maxTokens: 0,
      maxRetries: 2,
      timeoutMs: null,
    });

    expect(resolved.maxTokens).toBeNull();
    expect(resolved.generation.maxTokens).toBeUndefined();
    expect(resolved.generation.temperature).toBe(0.2);
  });

  it("falls back to the structured-JSON profile when no DB config exists", () => {
    const resolved = resolveWorkflowConfig(null);
    expect(resolved.source).toBe("envFallback");
    expect(resolved.configurationId).toBeNull();
    expect(resolved.provider).toBeNull();
    expect(resolved.generation).toEqual(STRUCTURED_JSON_GENERATION);
  });
});
