import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "db",
    environment: "node",
    include: ["tests/**/*.test.ts"],
    server: {
      deps: {
        inline: [/@portfolio\//],
      },
    },
  },
});
