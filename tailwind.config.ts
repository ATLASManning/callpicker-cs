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
        page:       '#F5F8FB',      // page background — azul pastel suave
        bgAlt:      '#10355D',      // sidebar (stays dark navy)
        surface:    '#FFFFFF',      // card background
        surfaceAlt: '#EAF1F7',      // subtle card variant
        border:     '#DFE8EF',      // light blue border

        // Callpicker brand
        cp:       '#0057FF',
        cpLight:  '#1D6CAA',
        cpTeal:   '#39ABD8',

        // Text hierarchy (optimised for white bg)
        textHi:   '#202E3B',        // near-black
        textMid:  '#3D4B5C',        // medium slate
        textLow:  '#6A7889',        // muted slate

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
        'dash-navy-900':   '#082742',
        'dash-navy-700':   '#10355D',
        'dash-navy-500':   '#1D6CAA',
        'dash-silver-300': '#DFE8EF',
        'dash-silver-500': '#A8BACB',
        'dash-silver-700': '#6A7889',
        'dash-orange-500': '#39ABD8',
        'dash-orange-400': '#8AD7F8',
        'dash-orange-700': '#1D6CAA',
        'dash-white':      '#FFFFFF',
        'dash-white-soft': '#F5F8FB',
        /* Las tres bandas de riesgo. El paso medio NO está en la paleta base:
           es la interpolación en OKLab entre plata-300 y naranja-500, que es
           lo que hace que los tres pasos se separen 11.1 entre sí. */
        'dash-riesgo-bajo':  '#DFE8EF',
        'dash-riesgo-medio': '#95CAE4',
        'dash-riesgo-alto':  '#39ABD8',
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
