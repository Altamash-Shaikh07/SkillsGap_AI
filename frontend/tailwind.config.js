/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          500: '#4361ee',
          600: '#3451d1',
          700: '#2a40b8',
        },
        accent: {
          400: '#7209b7',
          500: '#560bad',
        },
        success: '#06d6a0',
        warning: '#ffd166',
        danger: '#ef476f',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
