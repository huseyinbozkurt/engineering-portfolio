import { describe, expect, it } from "vitest";

import {
  computeDatasetHash,
  normalizeInsightDataset,
  stableStringify,
} from "../src/insights/dataset-hash";
import { makeInput } from "./fixtures";

describe("stableStringify", () => {
  it("is independent of object key insertion order", () => {
    expect(stableStringify({ a: 1, b: { x: 1, y: 2 } })).toBe(
      stableStringify({ b: { y: 2, x: 1 }, a: 1 }),
    );
  });

  it("preserves array order (arrays are semantic)", () => {
    expect(stableStringify([1, 2, 3])).not.toBe(stableStringify([3, 2, 1]));
  });
});

describe("normalizeInsightDataset", () => {
  it("drops the volatile meta.generatedAt and keeps semantic fields", () => {
    const normalized = normalizeInsightDataset(makeInput()) as { meta: Record<string, unknown> };
    expect(normalized.meta).not.toHaveProperty("generatedAt");
    expect(normalized.meta).toHaveProperty("totals");
    expect(normalized).toHaveProperty("records");
  });
});

describe("computeDatasetHash", () => {
  it("is stable for equivalent inputs", () => {
    expect(computeDatasetHash(makeInput())).toBe(computeDatasetHash(makeInput()));
  });

  it("ignores meta.generatedAt so a fresh build does not bust the cache", () => {
    const base = makeInput();
    const rebuilt = makeInput();
    rebuilt.meta.generatedAt = "2030-12-31T23:59:59.000Z";
    expect(computeDatasetHash(rebuilt)).toBe(computeDatasetHash(base));
  });

  it("changes when meaningful dataset content changes", () => {
    const base = makeInput();
    const changed = makeInput();
    changed.records.experiences[0]!.summary = "A completely different summary.";
    expect(computeDatasetHash(changed)).not.toBe(computeDatasetHash(base));
  });

  it("is independent of record key ordering", () => {
    const base = makeInput();
    const reordered = makeInput();
    const exp = reordered.records.experiences[0]!;
    // Same content, different key insertion order.
    reordered.records.experiences[0] = {
      outcomes: exp.outcomes,
      summary: exp.summary,
      endDate: exp.endDate,
      startDate: exp.startDate,
      role: exp.role,
      title: exp.title,
      type: exp.type,
      ref: exp.ref,
    } as typeof exp;
    expect(computeDatasetHash(reordered)).toBe(computeDatasetHash(base));
  });
});
