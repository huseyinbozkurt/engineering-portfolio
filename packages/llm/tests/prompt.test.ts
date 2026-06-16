import { describe, expect, it } from "vitest";

import {
  PORTFOLIO_INSIGHT_PROMPT_V1,
  PORTFOLIO_INSIGHT_PROMPT_V2,
  PORTFOLIO_INSIGHT_PROMPT_V3,
  PORTFOLIO_INSIGHT_PROMPT_V4,
  getInsightPromptVersion,
  insightPromptVersions,
  latestInsightPromptVersion,
} from "../src/insights/prompt";
import { REFS, makeInput } from "./fixtures";

describe("insight prompt registry", () => {
  it("tracks versions and resolves the latest", () => {
    expect(latestInsightPromptVersion).toBe(PORTFOLIO_INSIGHT_PROMPT_V4);
    expect(insightPromptVersions[PORTFOLIO_INSIGHT_PROMPT_V1]?.version).toBe(
      PORTFOLIO_INSIGHT_PROMPT_V1,
    );
    expect(insightPromptVersions[PORTFOLIO_INSIGHT_PROMPT_V2]?.version).toBe(
      PORTFOLIO_INSIGHT_PROMPT_V2,
    );
    expect(insightPromptVersions[PORTFOLIO_INSIGHT_PROMPT_V3]?.version).toBe(
      PORTFOLIO_INSIGHT_PROMPT_V3,
    );
    expect(insightPromptVersions[PORTFOLIO_INSIGHT_PROMPT_V4]?.version).toBe(
      PORTFOLIO_INSIGHT_PROMPT_V4,
    );
  });

  it("throws for unknown versions instead of silently falling back", () => {
    expect(() => getInsightPromptVersion("portfolio-insight-v999")).toThrow(
      "Unknown insight prompt version",
    );
  });
});

describe("PORTFOLIO_INSIGHT_PROMPT_V4", () => {
  const prompt = getInsightPromptVersion(PORTFOLIO_INSIGHT_PROMPT_V4).build(makeInput());

  it("makes signalRadar the homepage capability score authority", () => {
    expect(prompt.system).toContain("HOMEPAGE CAPABILITY RULES");
    expect(prompt.system).toContain("signalRadar is the single source of truth");
    expect(prompt.system).toContain("Do not independently generate homepage capability scores");
    expect(prompt.user).toContain("radarKey");
    expect(prompt.user).not.toContain("Short reason for the score");
  });
});

describe("PORTFOLIO_INSIGHT_PROMPT_V2", () => {
  const prompt = getInsightPromptVersion(PORTFOLIO_INSIGHT_PROMPT_V2).build(makeInput());

  it("uses the executive-readout guardrails with strict cited evidence", () => {
    expect(prompt.system).toContain("executive readout");
    expect(prompt.system).toContain("Do not invent achievements");
    expect(prompt.system).toContain("EVIDENCE RULES");
    expect(prompt.system).toContain('{"ref": "...", "note": "..."}');
    expect(prompt.system).toContain("Return valid JSON only");
    expect(prompt.system).toContain("Validate every evidence ref exists in input.records");
  });

  it("embeds the response shape and the dataset", () => {
    expect(prompt.user).toContain("RESPONSE SHAPE:");
    expect(prompt.user).toContain("DATASET:");
    expect(prompt.user).toContain("executiveSummary");
    expect(prompt.user).toContain("signalRadar");
    expect(prompt.user).toContain(REFS.experience);
    expect(prompt.user).toContain("published-only");
  });

  it("is deterministic for the same input", () => {
    const again = getInsightPromptVersion(PORTFOLIO_INSIGHT_PROMPT_V2).build(makeInput());
    expect(again.system).toBe(prompt.system);
    expect(again.user).toBe(prompt.user);
  });
});
