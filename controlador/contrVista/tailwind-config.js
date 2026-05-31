/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./vista/*.html",
    "./index.html",
    "./controlador/contrVista/*.js"
  ],
  theme: {
    extend: {
      screens: {
        'sm': '320px',   // Rango c) Inicio
        'md': '768px',   // Rango b) Inicio
        'lg': '1024px',  // Rango a) Inicio
        'xl': '1280px',
        '2xl': '1536px',
      },
      colors: {
        rose:  '#F6D4CB',
        coral: '#FB9C83',
        brown: '#956659',
      },
      fontFamily: {
        sans: ['"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 6px rgba(0,0,0,0.06)',
        card: '0 4px 12px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
};
