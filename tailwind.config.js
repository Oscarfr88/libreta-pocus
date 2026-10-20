/** @type {import('tailwindcss').Config} */

// El color principal lo elige la institución en Ajustes; se inyecta como variables CSS
// (ver src/utils/color.ts → aplicarColorPrimario).
const v = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primario: {
          DEFAULT: v('--primario'),
          oscuro: v('--primario-oscuro'),
          texto: v('--primario-texto'),
          claro: v('--primario-claro'),
          suave: v('--primario-suave'),
          sobre: v('--sobre-primario'),
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.18)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s cubic-bezier(0.22,1,0.36,1)',
      },
    },
  },
  plugins: [],
};
