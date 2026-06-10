import { describe, expect, it } from "vitest";

import {
  PORTFOLIO_INSIGHT_PROMPT_V1,
  getInsightPromptVersion,
  insightPromptVersions,
  latestInsightPromptVersion,
} from "../src/insights/prompt";
import { REFS, makeInput } from "./fixtures";

describe("insight prompt registry", () => {
  it("tracks versions and resolves the latest", () => {
    expect(latestInsightPromptVersion).toBe(PORTFOLIO_INSIGHT_PROMPT_V1);
    expect(insightPromptVersions[PORTFOLIO_INSIGHT_PROMPT_V1]?.version).toBe(
      PORTFOLIO_INSIGHT_PROMPT_V1,
    );
  });

  it("throws for unknown versions instead of silently falling back", () => {
    expect(() => getInsightPromptVersion("portfolio-insight-v999")).toThrow(
      "Unknown insight prompt version",
    );
  });
});

describe("PORTFOLIO_INSIGHT_PROMPT_V1", () => {
  const prompt = getInsightPromptVersion(PORTFOLIO_INSIGHT_PROMPT_V1).build(makeInput());

  it("forbids fabrication and demands strict JSON with cited refs", () => {
    expect(prompt.system).toContain("Never invent");
    expect(prompt.system).toContain("STRICT JSON");
    expect(prompt.system).toContain('{"ref"');
    // Confidence must be tied to evidence strength — wording-agnostic check so
    // prompt copy can evolve (the deterministic enforcement lives in validate.ts).
    expect(prompt.system.toLowerCase()).toContain("confidence");
    expect(prompt.system.toLowerCase()).toContain("evidence");
  });

  it("embeds the response shape and the dataset", () => {
    expect(prompt.user).toContain("executiveSummary");
    expect(prompt.user).toContain("signalRadar");
    expect(prompt.user).toContain(REFS.experience);
    expect(prompt.user).toContain("published-only");
  });

  it("is deterministic for the same input", () => {
    const again = getInsightPromptVersion(PORTFOLIO_INSIGHT_PROMPT_V1).build(makeInput());
    expect(again.system).toBe(prompt.system);
    expect(again.user).toBe(prompt.user);
  });
});
