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
        // Main content — light blue-white theme
        page:       '#DBEAFE',      // page background — azul pastel
        bgAlt:      '#1E3A5F',      // sidebar (stays dark navy)
        surface:    '#FFFFFF',      // card background
        surfaceAlt: '#F0F7FF',      // subtle card variant
        border:     '#BFDBFE',      // light blue border

        // Callpicker brand
        cp:       '#0057FF',
        cpLight:  '#3B82F6',
        cpTeal:   '#0EA5E9',

        // Text hierarchy (optimised for white bg)
        textHi:   '#0F172A',        // near-black
        textMid:  '#334155',        // medium slate
        textLow:  '#64748B',        // muted slate

        // Semáforo — slightly deeper for white bg legibility
        verde:    '#16A34A',
        azul:     '#2563EB',
        amarillo: '#CA8A04',
        naranja:  '#EA580C',
        rojo:     '#DC2626',
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
