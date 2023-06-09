/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    colors: {
      primary: "hsl(281 56% 40% / 1)",
      "primary-dark-1": "hsl(281 56% 36% / 1)",
      "primary-dark-2": "hsl(281 56% 32% / 1)",
      midnight: "hsl(263 36% 10%)",
      "midnight-1": "hsl(263 36% 20%)",
      transparent: "transparent",
      white: "rgb(255 255 255)",
      "white-hov": "rgb(255 255 255 / 5%)",
      "white-act": "rgb(255 255 255 / 8%)",
      gray: "hsl(0 0% 70%)",
      red: "hsl(2 98% 44%)",
      "red-bg": "hsl(341 66% 22%)",
      error: "rgb(255 100 100)",
    },
  },
  plugins: [],
};
