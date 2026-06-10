import { defineConfig } from "vitest/config";

/**
 * Workspace test runner. Each package owns its config; this root config wires
 * them together so `pnpm test` runs everything.
 */
export default defineConfig({
  test: {
    projects: ["packages/llm", "packages/validators", "packages/db"],
  },
});
