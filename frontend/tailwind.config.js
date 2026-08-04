/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['JetBrains Mono', 'Fira Code', 'IBM Plex Mono', 'monospace'],
        mono: ['JetBrains Mono', 'Fira Code', 'IBM Plex Mono', 'monospace'],
      },
      colors: {
        terminal: {
          bg: "#031406",
          surface: "#08240d",
          panel: "#0b2e11",
          card: "#061f0a",
          border: "#1b5924",
          'border-bright': "#288237",
          green: "#33ff66",
          'green-bright': "#00ff41",
          'green-dim': "#55aa66",
          'green-dark': "#0a3813",
          muted: "#448855",
        },
        severity: {
          critical: "#ff3333",
          'critical-bg': "rgba(255, 51, 51, 0.15)",
          high: "#ff9900",
          'high-bg': "rgba(255, 153, 0, 0.15)",
          medium: "#ffcc00",
          'medium-bg': "rgba(255, 204, 0, 0.15)",
          low: "#33ff66",
          'low-bg': "rgba(51, 255, 102, 0.15)",
        }
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(1.15)' },
        },
        'terminal-blink': {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        }
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'terminal-blink': 'terminal-blink 1s infinite',
      }
    },
  },
  plugins: [],
}
