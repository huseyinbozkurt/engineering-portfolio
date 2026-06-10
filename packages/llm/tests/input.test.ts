import { describe, expect, it } from "vitest";

import { portfolioInsightInputSchema } from "@portfolio/validators";

import {
  buildPortfolioInsightInput,
  compactText,
  extractMeasurableLines,
  isInsightInputEmpty,
} from "../src/insights/input";
import { makeSource } from "./fixtures";

describe("buildPortfolioInsightInput", () => {
  const input = buildPortfolioInsightInput(makeSource());

  it("produces a snapshot that satisfies the input schema", () => {
    const parsed = portfolioInsightInputSchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it("issues slug-based refs and falls back to ids", () => {
    expect(input.records.experiences[0]?.ref).toBe("experience:acme-senior-engineer");
    expect(input.records.projects[0]?.ref).toBe("project:release-dashboard");

    const noSlug = makeSource();
    noSlug.experiences[0]!.slug = null;
    const fallback = buildPortfolioInsightInput(noSlug);
    expect(fallback.records.experiences[0]?.ref).toBe("experience:e1");
  });

  it("maps relations to relatedRefs and drops pairs pointing at unpublished records", () => {
    const caseStudy = input.records.caseStudies[0]!;
    expect(caseStudy.relatedRefs).toContain("experience:acme-senior-engineer");
    expect(caseStudy.relatedRefs).toContain("project:release-dashboard");
    // The fixture includes a caseStudySkills pair targeting "missing-skill".
    expect(caseStudy.relatedRefs?.some((ref) => ref.includes("missing"))).toBe(false);
  });

  it("links projects to their owning experience", () => {
    expect(input.records.projects[0]?.relatedRefs).toContain("experience:acme-senior-engineer");
  });

  it("extracts awards, outcomes, and technology signals", () => {
    const experience = input.records.experiences[0]!;
    expect(experience.awards).toEqual(["Excellent Engineer Award 2022", "Top Performer"]);
    expect(experience.outcomes?.some((line) => line.includes("35% to 85%"))).toBe(true);
    expect(experience.technologies).toContain("TypeScript");

    const project = input.records.projects[0]!;
    expect(project.technologies).toContain("Next.js 16");
    expect(project.technologies).toContain("Playwright");
    expect(project.technologies).toContain("AWS ECS");
    // Deduped: TypeScript appears as related skill and stack line only once.
    expect(project.technologies?.filter((tech) => tech === "TypeScript")).toHaveLength(1);
  });

  it("reports totals for published records and passes draft counts through", () => {
    expect(input.meta.totals.experiences).toBe(1);
    expect(input.meta.totals.tags).toBe(0);
    expect(input.meta.draftCounts.projects).toBe(2);
    expect(input.meta.scope).toBe("published-only");
  });
});

describe("isInsightInputEmpty", () => {
  it("is false for the fixture and true when core records are missing", () => {
    expect(isInsightInputEmpty(buildPortfolioInsightInput(makeSource()))).toBe(false);

    const empty = makeSource();
    empty.experiences = [];
    empty.projects = [];
    empty.caseStudies = [];
    empty.skills = [];
    expect(isInsightInputEmpty(buildPortfolioInsightInput(empty))).toBe(true);
  });
});

describe("text helpers", () => {
  it("compacts whitespace and truncates with an ellipsis", () => {
    expect(compactText("a   b\n\nc", 100)).toBe("a b c");
    const long = "x".repeat(50);
    expect(compactText(long, 20)).toHaveLength(20);
    expect(compactText(long, 20).endsWith("...")).toBe(true);
  });

  it("extracts only sentences containing numbers", () => {
    const lines = extractMeasurableLines(
      "Improved throughput by 40%. Great teamwork all around. Shipped 12 releases.",
    );
    expect(lines).toHaveLength(2);
    expect(extractMeasurableLines("No numbers here at all.")).toBeUndefined();
  });
});
