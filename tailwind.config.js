/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        board: '#1f6f54',
        tile: '#f3e3bd',
        tileEdge: '#d9c48f',
      },
      fontFamily: {
        display: ['"Trebuchet MS"', 'Verdana', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
