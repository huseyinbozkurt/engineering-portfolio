import type { Config } from "tailwindcss";

const config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#0c0f14",
        ink: "#f6f7f9",
        muted: "#9aa4b2",
        line: "rgba(255,255,255,0.08)",
        "line-strong": "rgba(255,255,255,0.14)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -16px rgba(0,0,0,0.6)",
        pop: "0 24px 64px -16px rgba(0,0,0,0.7)",
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
