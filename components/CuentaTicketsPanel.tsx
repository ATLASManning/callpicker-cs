import { Ticket, AlertTriangle, ExternalLink, SearchX } from 'lucide-react'
import type { TicketRow } from '@/lib/cuenta-data'

const PRIOR_COLOR: Record<string, string> = {
  High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e', Urgent: '#b91c1c',
}

function PriorBadge({ p }: { p: string }) {
  const color = PRIOR_COLOR[p] ?? '#6b7280'
  // Un campo vacío pintaba una pastilla muda. 242 tickets del archivo no traen
  // prioridad, y eso es un dato, no un hueco que haya que disimular.
  const etiqueta = (p ?? '').trim() || 'Sin prioridad'
  return (
    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ background: color + '18', color }}>
      {etiqueta}
    </span>
  )
}

function fmtFecha(d: string) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }) }
  catch { return d }
}

export default function CuentaTicketsPanel({
  rows, total, matchedBy, cid, empresa, fallas, comoCruzo = 'ninguno',
}: {
  rows: TicketRow[]
  total: number
  matchedBy: string
  cid: string | null
  empresa: string
  /** Fallas del TOTAL, no de las 20 filas visibles. */
  fallas: number
  /** Cómo se cruzó la cuenta con el dataset. Decide qué se puede afirmar. */
  comoCruzo?: 'cid' | 'nombre' | 'ninguno'
}) {
  const lastFecha = rows[0]?.apertura || rows[0]?.fecha || ''
  const ticketsUrl = cid
    ? `/tickets?cid=${encodeURIComponent(cid)}`
    : `/tickets?q=${encodeURIComponent(empresa)}`

  return (
    <div className="cp-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Ticket size={13} className="text-textMid" />
          <h3 className="text-xs font-semibold text-textMid uppercase tracking-wide">
            Tickets Zoho Desk
          </h3>
          <span className={`text-[10px] font-semibold text-white px-1.5 py-0.5 rounded-full ${total > 0 ? 'bg-cp/80' : 'bg-textLow/40'}`}>
            {total}
          </span>
          {fallas > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-rojo bg-rojo/10 px-1.5 py-0.5 rounded-full">
              <AlertTriangle size={9} /> {fallas} falla{fallas > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <a href={ticketsUrl} className="flex items-center gap-1 text-[10px] text-cp hover:underline">
          Ver todos <ExternalLink size={10} />
        </a>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center gap-2 py-5 text-center">
          <SearchX size={22} className="text-textLow/40" />
          {/* «No se cruzó» y «no tiene tickets» son cosas distintas, y antes las
              dos decían lo mismo. Grupo Petroil tiene 32 tickets reales bajo
              cuatro CIDs que su ficha no declara: decirle «sin tickets» es
              afirmar algo que no se midió. */}
          <p className="text-[11px] text-textLow">
            {cid
              ? `Ningún ticket del export cuelga del CID ${cid}`
              : 'Sin CID capturado: no se pudo cruzar con el export de Zoho'}
          </p>
          {/* Va en un <span> que DECLARA `background`, no en un <p>: dentro de
              .cp-card el CSS fuerza `<p>` a blanco con !important y sin cláusula
              de escape, así que el ámbar se perdería. Al <span> sí lo respeta
              (`span:not([style*="background"])`). */}
          <div>
            <span className="text-[10px] px-2 py-1 rounded inline-block"
              style={{ background: 'rgba(245,158,11,0.16)', color: '#FCD34D' }}>
              {cid
                ? 'Esto NO prueba que la cuenta no tenga soporte: puede operar con otro CID.'
                : 'Configura el CID en la cuenta para cruzar de forma exacta.'}
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Total',       val: total },
              { label: 'Fallas',      val: fallas, color: fallas > 0 ? '#ef4444' : undefined },
              { label: 'Últ. ticket', val: fmtFecha(lastFecha), mono: true },
            ].map(({ label, val, color, mono }) => (
              <div key={label} className="bg-surface rounded-lg px-3 py-2 text-center">
                <p className="text-[10px] text-textLow mb-0.5">{label}</p>
                <p className={`text-xs font-bold ${mono ? 'text-textMid' : 'text-textHi'}`}
                  style={color ? { color } : {}}>
                  {val}
                </p>
              </div>
            ))}
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {['Fecha','Categoría','Subcategoría','Producto','Prior.','Falla'].map(h => (
                    <th key={h} className={`pb-1.5 text-textLow font-medium text-[10px] ${h === 'Falla' ? 'text-center' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((t, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-surface/50" title={t.cierre ? `Cierre: ${fmtFecha(t.cierre)}` : ''}>
                    <td className="py-1.5 text-textLow whitespace-nowrap">{fmtFecha(t.apertura || t.fecha)}</td>
                    <td className="py-1.5 text-textMid max-w-[110px] truncate" title={t.categoria}>{t.categoria}</td>
                    <td className="py-1.5 text-textLow max-w-[110px] truncate" title={t.subcategoria}>{t.subcategoria}</td>
                    <td className="py-1.5 text-textMid max-w-[90px] truncate" title={t.producto}>{t.producto}</td>
                    <td className="py-1.5"><PriorBadge p={t.prioridad} /></td>
                    <td className="py-1.5 text-center">
                      {t.es_falla === 'Si'
                        ? <span className="text-[9px] font-bold text-rojo">●</span>
                        : <span className="text-[9px] text-textLow">○</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* El aviso se pintaba con `matchedBy && !cid`, o sea SOLO cuando la
              cuenta no tenía CID — justo al revés del caso peligroso. El
              peligroso es que la cuenta SÍ tenga CID, ese CID no tenga tickets, y
              el código caiga al cruce por nombre: ahí el panel presentaba
              tickets de otra empresa sin ninguna marca. */}
          {comoCruzo === 'nombre' && (
            <div className="mt-2 text-center">
              <span className="text-[9px] italic px-1.5 py-0.5 rounded inline-block"
                style={{ background: 'rgba(245,158,11,0.16)', color: '#FCD34D' }}>
                Cruzado por NOMBRE ({matchedBy}){cid ? `, no por su CID ${cid}` : ''} — verificar que sean de esta cuenta
              </span>
            </div>
          )}
          {comoCruzo === 'cid' && (
            <div className="mt-2 text-[9px] text-center italic" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Cruzado por {matchedBy}
              {total > rows.length ? ` · se muestran los ${rows.length} más recientes de ${total}` : ''}
            </div>
          )}
        </>
      )}
    </div>
  )
}
