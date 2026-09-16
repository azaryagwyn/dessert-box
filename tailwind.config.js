/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bakery: {
          50: '#fdf8f5',
          100: '#faeee6',
          200: '#f5dccf',
          300: '#ecc2ad',
          400: '#e09f83',
          500: '#d47b59',
          600: '#c5613e',
          700: '#a44c2f',
          800: '#86402b',
          900: '#6e3727',
        },
        chocolate: {
          800: '#3D2314',
          900: '#2A170A',
        },
        cream: {
          50: '#FFFAF3',
          100: '#FFF5E6',
        }
      }
    },
  },
  plugins: [],
}
