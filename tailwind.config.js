/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'night-bg': '#09090b',
        'night-card': '#121215',
        'night-border': '#27272a',
        'neon-violet': '#be123c',
        'neon-cyan': '#e11d48',
        'night-text': '#a1a1aa',
        'goth-crimson': '#881337',
        'goth-blood': '#be123c',
        'goth-ruby': '#e11d48',
        'goth-silver': '#f4f4f5',
        'goth-dark': '#09090b',
      },
      fontFamily: {
        title: ['Cinzel', 'Playfair Display', 'Georgia', 'serif'],
        body: ['Inter', 'sans-serif'],
        goth: ['Cinzel', 'serif'],
        editorial: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}