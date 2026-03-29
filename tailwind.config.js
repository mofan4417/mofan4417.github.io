/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'volunteer': {
          DEFAULT: '#2B0B0B',
          dark: '#1A0707',
          light: '#E84C4C',
          soft: '#F6A9B6',
          peach: '#F9D8C6',
          'peach-dark': '#F7CBB6',
          text: '#F3DDE4',
        },
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
};
