import type { Config } from "tailwindcss";

/**
 * Admin design tokens. Colors, radii, shadows, typography, and motion live here
 * so components reference semantic tokens (`accent`, `success`, `surface`, …)
 * instead of hardcoded palette values — re-theming happens in one place.
 *
 * The brand/interactive accent is violet; status semantics are success (emerald),
 * warning (amber), and danger (rose). The scales mirror Tailwind's palettes so
 * opacity modifiers (`bg-accent-500/30`) and shades stay consistent.
 */
const config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces & text
        surface: "#0c0f14",
        ink: "#f6f7f9",
        muted: "#9aa4b2",
        line: "rgba(255,255,255,0.08)",
        "line-strong": "rgba(255,255,255,0.14)",
        // Brand / interactive accent (violet)
        accent: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          DEFAULT: "#8b5cf6",
        },
        // Status — success (emerald)
        success: {
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          DEFAULT: "#34d399",
        },
        // Status — warning (amber)
        warning: {
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          DEFAULT: "#fde68a",
        },
        // Status — danger (rose)
        danger: {
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          DEFAULT: "#fb7185",
        },
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -16px rgba(0,0,0,0.6)",
        pop: "0 24px 64px -16px rgba(0,0,0,0.7)",
        focus: "0 0 0 2px rgba(139,92,246,0.4)",
      },
      fontSize: {
        eyebrow: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.08em" }],
      },
      transitionTimingFunction: {
        ui: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
