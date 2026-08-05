import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fcf5f8",
          100: "#f5dce7",
          500: "#861745",
          600: "#6B1036",
          700: "#500a28"
        },
        gold: {
          100: "#edf8d9",
          400: "#b8e276",
          500: "#A4D65E",
          600: "#77ad32"
        }
      },
      boxShadow: {
        soft: "0 20px 55px rgba(107, 16, 54, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
