/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#090d16",
          card: "#111827",
          border: "#1f2937",
          accent: "#3b82f6",
          alert: "#ef4444",
          success: "#10b981",
          warning: "#f59e0b",
        }
      }
    },
  },
  plugins: [],
}
