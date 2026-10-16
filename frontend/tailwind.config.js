/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sentinel: {
          950: '#06090e',
          900: '#0d131f',
          850: '#121a2b',
          800: '#1a243a',
          700: '#263554',
          600: '#384d7a',
          500: '#4f6ca8',
          accent: '#06b6d4',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
