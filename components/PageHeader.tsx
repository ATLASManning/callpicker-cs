interface Props {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  dark?: boolean
}

/* ── LA RAMA CLARA USA LA PALETA DEL DOCUMENTO (14 oct 2026) ───────────────
 *
 * Esta cabecera la comparte TODO el tablero, así que el título de cada
 * pantalla salía en `#0F172A` y su subtítulo en `#475569` —los tonos de la
 * paleta anterior— mientras Dashboard, Activaciones 2.0, Atlas y ahora
 * Tickets ya van con la del Customer Success Operating System. Se vio al
 * mirar Tickets: el fondo y las pestañas ya eran del documento y el título
 * seguía siendo el negro de antes.
 *
 * Pasan a `--ink #202E3B` y al medio `#3D4B5C`, medidos sobre el lavado de la
 * página en `scripts/mide-paleta-tickets.py`: 13.00:1 y 8.35:1. Bajan desde
 * 16.5 y 7.5, así que siguen holgadísimos — un título no gana nada por ser
 * más negro que el texto que lo acompaña.
 *
 * LA RAMA `dark` NO SE TOCA. Vive sobre superficies oscuras y sus tonos están
 * medidos contra ellas; cambiarla aquí sería arrastrar una pantalla que nadie
 * ha mirado. [[atlas-dashboard-contrast-architecture]]
 */
export default function PageHeader({ title, subtitle, actions, dark = false }: Props) {
  return (
    <div className="flex items-start justify-between px-6 pt-6 pb-4">
      <div>
        <h1
          className="text-2xl font-extrabold tracking-tight"
          style={{
            color: dark ? '#E8F4FF' : '#202E3B',
            letterSpacing: '-0.02em',
            textShadow: dark
              ? '0 0 30px rgba(0,180,255,0.25)'
              : '0 1px 0 rgba(255,255,255,0.8)',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-sm mt-0.5"
            style={{ color: dark ? 'rgba(200,228,255,0.55)' : '#3D4B5C' }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
