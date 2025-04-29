import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        customGray: {
          300: "#D9D9D9", // Lighter gray
          400: "#C7C7C7", // Light gray
          500: "#A6A6A6", // Neutral gray
          600: "#5e5e5e", // Slightly darker gray
          700: "#4e4e4e", // Darker neutral gray
          800: "#3e3e3e", // Even darker neutral gray
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
