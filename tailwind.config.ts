/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB", // Tailwind blue-600
        secondary: "#1E293B", // Slate-800
      },
    },
  },
  darkMode: "class", // Enables dark mode toggle
  plugins: [],
};

