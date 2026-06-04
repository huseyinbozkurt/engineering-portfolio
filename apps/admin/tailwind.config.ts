import type { Config } from "tailwindcss";

const config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#090b0f",
        ink: "#f6f7f9",
        muted: "#9aa4b2",
        line: "rgba(255,255,255,0.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
