import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "validators",
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
