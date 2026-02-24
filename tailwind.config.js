/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Outfit', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 16px 48px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
}
