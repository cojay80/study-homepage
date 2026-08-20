/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Magical Theme Colors
        cream: '#FDFBF7',
        pink: {
          DEFAULT: '#FF4081', // Magenta Pink
          light: '#FF80AB',
          bg: '#FCE4EC',
        },
        blue: {
          DEFAULT: '#80D8FF', // Sky Blue
          dark: '#00B0FF',
          bg: '#E1F5FE',
        },
        // Subject Colors
        subject: {
          korean: '#FFD740', // Yellow
          math: '#448AFF',   // Blue
          english: '#FF4081', // Pink
          dictation: '#00E676', // Green
        },
      },
      fontFamily: {
        // DSG Fonts
        title: ['"Jua"', 'sans-serif'],
        body: ['"Noto Sans KR"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
