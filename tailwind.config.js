/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    colors: {
      accent: "hsl(281 56% 40% / 1)",
      "accent-dark-1": "hsl(281 56% 36% / 1)",
      "accent-dark-2": "hsl(281 56% 32% / 1)",
    },
  },
  plugins: [],
};
