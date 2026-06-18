import { describe, expect, it } from "vitest";

import {
  PORTFOLIO_INSIGHT_RESPONSE_SCHEMA,
  portfolioInsightOutputSchema,
} from "../src/insights";

describe("PORTFOLIO_INSIGHT_RESPONSE_SCHEMA", () => {
  it("names every top-level key of the Zod output schema (drift guard)", () => {
    const keys = Object.keys(portfolioInsightOutputSchema.shape);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(PORTFOLIO_INSIGHT_RESPONSE_SCHEMA).toContain(key);
    }
  });

  it("is a compact schema, not the old example-laden shape", () => {
    expect(PORTFOLIO_INSIGHT_RESPONSE_SCHEMA).not.toContain("type:slug-from-dataset");
    expect(PORTFOLIO_INSIGHT_RESPONSE_SCHEMA).not.toContain("Capability name");
    // A terse outline stays well under the old serialized shape's size.
    expect(PORTFOLIO_INSIGHT_RESPONSE_SCHEMA.length).toBeLessThan(1500);
  });
});
