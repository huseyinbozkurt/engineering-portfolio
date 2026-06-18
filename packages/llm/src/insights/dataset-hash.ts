import { createHash } from "node:crypto";

import type { PortfolioInsightInput } from "@portfolio/validators";

/**
 * Deterministic dataset hashing for AI-insight caching.
 *
 * A cache hit requires the *normalized* dataset to be byte-identical to a prior
 * successful run's. Normalization strips fields that change on every build but
 * carry no semantic meaning, then `stableStringify` emits keys in a fixed order
 * so equal objects with different key insertion order hash the same.
 */

/**
 * JSON serialization with object keys sorted at every depth. Array order is
 * preserved (it is semantic). Small internal helper so we avoid adding a
 * stable-stringify dependency. All dates in the snapshot are already ISO
 * strings, so no special Date handling is needed.
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortDeep(value));
}

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortDeep);
  }
  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      sorted[key] = sortDeep(source[key]);
    }
    return sorted;
  }
  return value;
}

/**
 * Drop volatile fields that must NOT trigger regeneration. Today that is only
 * `meta.generatedAt` — a fresh `new Date().toISOString()` set on every build of
 * the snapshot; if it were hashed the cache could never hit. Everything else
 * (totals, scope, draftCounts, all records) is semantic content, so portfolio
 * edits, added/removed records, and relation changes all change the hash. The
 * snapshot carries no createdAt/updatedAt/deletedAt, so none survive to here.
 */
export function normalizeInsightDataset(input: PortfolioInsightInput): unknown {
  const { generatedAt: _generatedAt, ...meta } = input.meta;
  return { meta, records: input.records };
}

/** SHA-256 (hex) of the normalized, stably-serialized dataset. */
export function computeDatasetHash(input: PortfolioInsightInput): string {
  return createHash("sha256").update(stableStringify(normalizeInsightDataset(input))).digest("hex");
}
