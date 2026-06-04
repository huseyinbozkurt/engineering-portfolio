import type { Config } from "tailwindcss";

const config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#0b0d10",
        ink: "#f6f7f9",
        muted: "#9aa4b2",
        line: "rgba(255,255,255,0.12)",
      },
      boxShadow: {
        glow: "0 20px 80px rgba(45, 212, 191, 0.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
