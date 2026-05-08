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
        bg:       '#0A1628',
        bgAlt:    '#0F1E38',
        surface:  '#162038',
        surfaceAlt: '#1C2A48',
        border:   '#263352',
        // Callpicker brand
        cp:       '#0057FF',
        cpLight:  '#3B82F6',
        cpTeal:   '#00D4FF',
        // Text
        textHi:   '#F0F6FF',
        textMid:  '#94A3B8',
        textLow:  '#4B5E82',
        // Semáforo
        verde:    '#22C55E',
        azul:     '#3B82F6',
        amarillo: '#EAB308',
        naranja:  '#F97316',
        rojo:     '#EF4444',
      },
      boxShadow: {
        'glow-cp': '0 0 24px rgba(0,87,255,0.25)',
        'glow-teal': '0 0 20px rgba(0,212,255,0.2)',
        'card': '0 2px 8px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
export default config
