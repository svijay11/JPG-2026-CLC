/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          charcoal: '#1a1a1a',
          white: '#faf8f5',
          gold: '#c9a84c',
          'gold-light': '#dfc377',
          'gold-dark': '#9b7d2f',
          goldOverlay: 'rgba(212, 175, 55, 0.18)',
          silverOverlay: 'rgba(192, 192, 192, 0.18)',
          roseGoldOverlay: 'rgba(183, 110, 121, 0.25)',
        }
      },
      fontFamily: {
        serifHeading: ['"Cormorant Garamond"', '"Playfair Display"', 'Georgia', 'serif'],
        sansUI: ['"Josefin Sans"', '"Raleway"', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
