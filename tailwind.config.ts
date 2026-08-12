import type { Config } from "tailwindcss";

// Kinetic Pulse design system.
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#5D3FD3",
          50: "#F1EDFB",
          100: "#E2DAF8",
          200: "#C6B6F0",
          300: "#A991E9",
          400: "#8B6BE1",
          500: "#5D3FD3",
          600: "#4B32AA",
          700: "#382580",
          800: "#261955",
          900: "#130C2B",
        },
        secondary: {
          DEFAULT: "#00F5FF",
          50: "#E5FEFF",
          100: "#CCFDFF",
          200: "#99FBFF",
          300: "#66F9FF",
          400: "#33F7FF",
          500: "#00F5FF",
          600: "#00C4CC",
          700: "#009399",
          800: "#006266",
          900: "#003133",
        },
        ink: {
          DEFAULT: "#121212",
          soft: "#1C1C1E",
          muted: "#2A2A2E",
        },
        neutralbg: "#F8F9FA",
      },
      fontFamily: {
        sans: ["var(--font-hanken)", "system-ui", "sans-serif"],
        heading: ["var(--font-hanken)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(18,18,18,0.06), 0 8px 24px rgba(18,18,18,0.06)",
        glow: "0 0 0 1px rgba(93,63,211,0.25), 0 8px 30px rgba(93,63,211,0.25)",
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
