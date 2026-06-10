import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "llm",
    environment: "node",
    include: ["tests/**/*.test.ts"],
    server: {
      deps: {
        // Workspace packages export TypeScript source; inline so Vite transforms them.
        inline: [/@portfolio\//],
      },
    },
  },
});
