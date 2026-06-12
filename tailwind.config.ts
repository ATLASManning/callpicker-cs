import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        // Main content — dark naval theme
        page:       '#0d1829',      // page background — azul marino profundo
        bgAlt:      '#0E30CC',      // sidebar accent (se mantiene)
        surface:    '#132035',      // card background — naval medio
        surfaceAlt: '#1a2d47',      // subtle card variant
        border:     '#1e3055',      // border naval

        // Callpicker brand
        cp:       '#4d8bff',        // azul claro sobre fondo oscuro
        cpLight:  '#7fb3ff',
        cpTeal:   '#38bdf8',

        // Text hierarchy (optimised for dark bg)
        textHi:   '#e2ecf8',        // casi blanco azulado
        textMid:  '#8aaccb',        // azul grisáceo medio
        textLow:  '#4d6a88',        // azul grisáceo tenue

        // Semáforo — ajustados para fondo oscuro
        verde:    '#22C55E',
        azul:     '#3B82F6',
        amarillo: '#EAB308',
        naranja:  '#F97316',
        rojo:     '#EF4444',
      },
      boxShadow: {
        'glow-cp':   '0 0 24px rgba(0,87,255,0.18)',
        'glow-teal': '0 0 20px rgba(14,165,233,0.18)',
        'card':      '0 1px 4px rgba(0,87,255,0.08)',
      },
    },
  },
  plugins: [],
}
export default config
