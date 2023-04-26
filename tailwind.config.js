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
      "primary-black": "hsl(281 36% 10%)",
      transparent: "transparent",
      white: "rgb(255 255 255)",
      "white-5%": "rgb(255 255 255 / 5%)",
      "white-10%": "rgb(255 255 255 / 10%)",
      gray: "rgb(128 128 128)",
      error: "rgb(255 100 100)",
    },
  },
  plugins: [],
};
