import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FFF8F0",
        ink: "#2B1B12",
        primary: {
          DEFAULT: "#C1440E",
          dark: "#9C350A",
          light: "#E4692F",
        },
        accent: "#2E7D32",
        char: {
          DEFAULT: "#211b17",
          light: "#2a221c",
        },
        ember: {
          DEFAULT: "#b0451f",
          light: "#d05a2a",
        },
        gold: "#e3a83b",
        parchment: {
          DEFAULT: "#f1e7d2",
          light: "#fbf7ec",
        },
        river: {
          DEFAULT: "#48697a",
          light: "#82abbb",
        },
        ash: "#a89d8e",
        warm: {
          DEFAULT: "#3a2c1a",
          light: "#4a3a23",
        },
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "sans-serif"],
        serif: ["var(--font-bitter)", "serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
