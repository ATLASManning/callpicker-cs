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
        page:       '#EFF6FF',      // page background — azul pastel suave
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

        // Semáforo — legibles sobre fondo claro
        verde:    '#16A34A',
        azul:     '#2563EB',
        amarillo: '#CA8A04',
        naranja:  '#EA580C',
        rojo:     '#DC2626',

        /* ── DASHBOARD REDISEÑADO (oct 2026) ───────────────────────────────
           Paleta cerrada por dirección: azul marino, gris plata, naranja y
           blanco. Va en su propio espacio de nombres `dash-*` porque el RESTO
           del tablero sigue siendo claro (`page: #EFF6FF`) y mezclar los dos
           juegos de tokens es como vuelve el bug de contraste.

           La fuente de verdad es `lib/chart-theme.ts`, que lleva las
           mediciones. Esto es el espejo para las utilidades de Tailwind: si
           cambia uno hay que cambiar el otro, y
           `scripts/mide-paleta-dashboard.py` lo comprueba. */
        'dash-navy-900':   '#0B1F3A',
        'dash-navy-700':   '#12305A',
        'dash-navy-500':   '#1B4580',
        'dash-silver-300': '#C0C6CE',
        'dash-silver-500': '#8E96A3',
        'dash-silver-700': '#5B6573',
        'dash-orange-500': '#FF7A1A',
        'dash-orange-400': '#FF9A4D',
        'dash-orange-700': '#C85A00',
        'dash-white':      '#FFFFFF',
        'dash-white-soft': '#F4F6F9',
        /* Las tres bandas de riesgo. El paso medio NO está en la paleta base:
           es la interpolación en OKLab entre plata-300 y naranja-500, que es
           lo que hace que los tres pasos se separen 11.1 entre sí. */
        'dash-riesgo-bajo':  '#C0C6CE',
        'dash-riesgo-medio': '#E5A585',
        'dash-riesgo-alto':  '#FF7A1A',
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
