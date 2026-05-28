/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#0EA5A4',
          gold: '#D4AF37',
          navy: '#0B1F3B',
          white: '#FFFFFF',
        },
      },
    },
  },
  plugins: [],
}
