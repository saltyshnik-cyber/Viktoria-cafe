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
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
