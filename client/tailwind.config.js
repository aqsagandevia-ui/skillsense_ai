/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4f46e5",   // Indigo
        secondary: "#10b981", // Emerald / Green
      }
    }
  },
  plugins: [],
}
