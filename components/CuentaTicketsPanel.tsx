import { Ticket, AlertTriangle, ExternalLink, SearchX } from 'lucide-react'
import type { TicketRow } from '@/lib/cuenta-data'

const PRIOR_COLOR: Record<string, string> = {
  High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e', Urgent: '#b91c1c',
}

function PriorBadge({ p }: { p: string }) {
  const color = PRIOR_COLOR[p] ?? '#6b7280'
  return (
    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ background: color + '18', color }}>
      {p}
    </span>
  )
}

function fmtFecha(d: string) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }) }
  catch { return d }
}

export default function CuentaTicketsPanel({
  rows, total, matchedBy, cid, empresa,
}: {
  rows: TicketRow[]
  total: number
  matchedBy: string
  cid: string | null
  empresa: string
}) {
  const fallas    = rows.filter(t => t.es_falla === 'Si').length
  const lastFecha = rows[0]?.fecha ?? ''
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
          <p className="text-[11px] text-textLow">Sin tickets registrados en Zoho Desk</p>
          {!cid && (
            <p className="text-[10px] text-amarillo/80 bg-amarillo/10 px-2 py-1 rounded">
              Configura el CID en la cuenta para match exacto
            </p>
          )}
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
                  {['Fecha','Categoría','Producto','Prior.','Falla'].map(h => (
                    <th key={h} className={`pb-1.5 text-textLow font-medium text-[10px] ${h === 'Falla' ? 'text-center' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((t, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-surface/50">
                    <td className="py-1.5 text-textLow whitespace-nowrap">{fmtFecha(t.fecha)}</td>
                    <td className="py-1.5 text-textMid max-w-[110px] truncate">{t.categoria}</td>
                    <td className="py-1.5 text-textMid max-w-[90px] truncate">{t.producto}</td>
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

          {matchedBy && !cid && (
            <p className="mt-2 text-[9px] text-textLow/50 text-center italic">Coincidencia por {matchedBy}</p>
          )}
        </>
      )}
    </div>
  )
}
