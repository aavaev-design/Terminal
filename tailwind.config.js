/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#0b101d',
          panel: '#121a2d',
          border: '#1e2c4a',
          accent: '#1a8cff',
        }
      }
    },
  },
  plugins: [],
};
