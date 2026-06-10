import { describe, expect, it } from "vitest";

import {
  PORTFOLIO_INSIGHT_PROMPT_V1,
  getInsightPromptVersion,
} from "../src/insights/prompt";
import {
  AI_STORY_PROMPT_V1,
  getStoryPromptVersion,
  latestStoryPromptVersion,
  storyPromptVersions,
  type AiStoryContentContext,
} from "../src/stories/prompt";
import { parseAiGeneratedStory } from "../src/stories/parse";
import { makeInput } from "./fixtures";

function makeStoryContext(): AiStoryContentContext {
  return {
    lenses: [{ id: "l1", slug: "build-product", name: "Build Product", summary: "Product lens." }],
    experiences: [
      {
        id: "e1",
        slug: "acme-senior-engineer",
        company: "Acme",
        role: "Senior Engineer",
        startDate: "2019-01-01",
        endDate: null,
        isCurrent: true,
        summary: "Led release engineering.",
      },
    ],
    projects: [
      {
        id: "pr1",
        slug: "release-dashboard",
        name: "Release Dashboard",
        description: "Dashboard for release health.",
        experienceId: "e1",
      },
    ],
    caseStudies: [
      { id: "cs1", slug: "payments-reliability", title: "Payments Reliability", excerpt: "Stabilizing payments." },
    ],
    principles: [{ id: "p1", slug: "simplify", title: "Simplify", summary: "Less is more." }],
    skills: [{ id: "s1", slug: "typescript", name: "TypeScript", category: "Languages", summary: "" }],
    tags: [{ id: "t1", slug: "reliability", name: "Reliability", category: "Theme" }],
  };
}

describe("story prompt registry", () => {
  it("tracks versions and resolves the latest", () => {
    expect(latestStoryPromptVersion).toBe(AI_STORY_PROMPT_V1);
    expect(storyPromptVersions[AI_STORY_PROMPT_V1]?.version).toBe(AI_STORY_PROMPT_V1);
  });

  it("throws for unknown versions", () => {
    expect(() => getStoryPromptVersion("ai-story-v999")).toThrow("Unknown story prompt version");
  });
});

describe("AI_STORY_PROMPT_V1", () => {
  const prompt = getStoryPromptVersion(AI_STORY_PROMPT_V1).build(
    "We rebuilt the release pipeline and cut deploy time in half.",
    makeStoryContext(),
  );

  it("instructs structured story generation, not portfolio analysis", () => {
    expect(prompt.system).toContain("structured portfolio content");
    expect(prompt.system).toContain("Never create a lens part");
    expect(prompt.user).toContain("Existing content context");
    expect(prompt.user).toContain("User story:");
  });

  it("never shares a system prompt with the insights pipeline (regression)", () => {
    const insightPrompt = getInsightPromptVersion(PORTFOLIO_INSIGHT_PROMPT_V1).build(makeInput());

    expect(prompt.system).not.toBe(insightPrompt.system);
    // Mutually exclusive identifying phrases — a swap in either direction fails loudly.
    expect(prompt.system).not.toContain("career-intelligence analyst");
    expect(insightPrompt.system).not.toContain("structured portfolio content");
  });
});

describe("parseAiGeneratedStory", () => {
  const validStory = {
    title: "Release pipeline story",
    summary: "Generated parts for the release pipeline work.",
    lensRenameSuggestions: [
      { lensId: "l1", currentName: "Build Product", suggestedName: "Ship Product", reason: "Sharper" },
    ],
    parts: [
      {
        id: "skill-typescript",
        kind: "skill",
        title: "TypeScript",
        summary: "Primary language.",
        fields: { slug: "typescript", name: "TypeScript" },
        relations: {},
      },
      {
        id: "lens-should-be-dropped",
        kind: "lens",
        title: "Forbidden Lens",
        summary: "Models must not create lenses.",
        fields: {},
        relations: {},
      },
    ],
  };

  it("parses a valid story and drops forbidden lens parts", () => {
    const payload = parseAiGeneratedStory(JSON.stringify(validStory));
    expect(payload.title).toBe("Release pipeline story");
    expect(payload.parts).toHaveLength(1);
    expect(payload.parts[0]?.kind).toBe("skill");
    expect(payload.lensRenameSuggestions).toHaveLength(1);
  });

  it("extracts JSON wrapped in markdown fences", () => {
    const payload = parseAiGeneratedStory("```json\n" + JSON.stringify(validStory) + "\n```");
    expect(payload.parts).toHaveLength(1);
  });

  it("rejects malformed JSON", () => {
    expect(() => parseAiGeneratedStory("{ nope")).toThrow();
  });

  it("rejects responses with no usable parts", () => {
    expect(() =>
      parseAiGeneratedStory(JSON.stringify({ title: "x", summary: "y", parts: [] })),
    ).toThrow("did not include any usable content parts");
  });

  it("normalizes relations to string / string[] / null values only", () => {
    const story = {
      ...validStory,
      parts: [
        {
          id: "p",
          kind: "project",
          title: "P",
          summary: "",
          fields: {},
          relations: { skillIds: ["a", 5, "b"], experienceId: null, junk: { nested: true } },
        },
      ],
    };
    const payload = parseAiGeneratedStory(JSON.stringify(story));
    expect(payload.parts[0]?.relations).toEqual({ skillIds: ["a", "b"], experienceId: null });
  });
});
