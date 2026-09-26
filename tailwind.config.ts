import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f4ef",
          100: "#ebe4d6",
          200: "#d6c9b0",
          300: "#c0ab88",
          400: "#a88f66",
          500: "#8f754f",
          600: "#735e40",
          700: "#5a4a35",
          800: "#3d3326",
          900: "#2a231a",
          950: "#18140f",
        },
        cinnabar: {
          DEFAULT: "#c43c2c",
          dark: "#9a2e22",
          light: "#e85a48",
        },
        jade: {
          DEFAULT: "#2d6a5a",
          light: "#3d8a74",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Songti SC", "SimSun", "serif"],
        body: ["var(--font-body)", "Noto Sans SC", "PingFang SC", "sans-serif"],
      },
      keyframes: {
        "fade-slide-in": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "timeline-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(196, 60, 44, 0.4)" },
          "50%": { boxShadow: "0 0 0 6px rgba(196, 60, 44, 0)" },
        },
      },
      animation: {
        "fade-slide-in": "fade-slide-in 0.45s ease-out forwards",
        "timeline-pulse": "timeline-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
