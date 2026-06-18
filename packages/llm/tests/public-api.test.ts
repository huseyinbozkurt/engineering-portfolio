import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import * as publicApi from "../src/index";

describe("@portfolio/llm public boundary", () => {
  it("exports only the workflow trigger", () => {
    expect(Object.keys(publicApi)).toEqual(["runLlmTask"]);
  });

  it("does not expose implementation subpaths", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(import.meta.dirname, "../package.json"), "utf8"),
    ) as { exports: Record<string, string> };
    expect(manifest.exports).toEqual({ ".": "./src/index.ts" });
  });
});
