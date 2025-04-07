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
          500: "#A6A6A6", // Neutral gray
          600: "#5e5e5e", // Slightly darker gray
          700: "#4e4e4e", // Darker neutral gray
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
